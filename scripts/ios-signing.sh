#!/usr/bin/env bash
#
# Prepare iOS signing credentials — without a Mac.
#
# The usual instructions tell you to make a certificate request in Keychain
# Access. That is just an RSA key plus a PKCS#10 CSR, which openssl produces on
# any platform, so none of this needs macOS.
#
# Full sequence:
#
#   1. bash scripts/ios-signing.sh csr
#        → creates signing/distribution.key and signing/distribution.csr
#
#   2. developer.apple.com → Certificates → + → Apple Distribution
#        → upload distribution.csr, download the .cer into signing/
#
#   3. bash scripts/ios-signing.sh p12 signing/distribution.cer
#        → creates signing/distribution.p12
#
#   4. developer.apple.com → Identifiers, register your bundle id
#      → Profiles → + → App Store, download the .mobileprovision into signing/
#
#   5. App Store Connect → Users and Access → Integrations → App Store Connect
#      API → generate a key, download the .p8 (once only), note Key ID + Issuer ID
#
#   6. bash scripts/ios-signing.sh secrets
#        → prints the base64 values to paste into GitHub Actions secrets
#
# signing/ is gitignored. Nothing in it should ever be committed.

set -euo pipefail

DIR="signing"
KEY="$DIR/distribution.key"
CSR="$DIR/distribution.csr"
P12="$DIR/distribution.p12"

usage() {
  sed -n '3,30p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

cmd_csr() {
  mkdir -p "$DIR"

  if [ -f "$KEY" ]; then
    echo "error: $KEY already exists." >&2
    echo "Reusing it is usually what you want — a new key invalidates the" >&2
    echo "certificate built from the old one. Delete it only if you mean to." >&2
    exit 1
  fi

  # Apple requires RSA 2048 for distribution certificates.
  openssl genrsa -out "$KEY" 2048
  chmod 600 "$KEY"

  # Apple ignores the subject fields beyond the email/common name, but a CSR
  # with an empty subject is rejected outright.
  openssl req -new -key "$KEY" -out "$CSR" \
    -subj "/emailAddress=${APPLE_EMAIL:-you@example.com}/CN=Sports Genome Distribution/C=${CERT_COUNTRY:-US}"

  echo
  echo "Created:"
  echo "  $KEY   (private key — never leaves your machine, never commit)"
  echo "  $CSR   (upload this to developer.apple.com)"
  echo
  echo "Next: Certificates → + → Apple Distribution → upload the .csr,"
  echo "then download the .cer into $DIR/ and run:"
  echo "  bash scripts/ios-signing.sh p12 $DIR/distribution.cer"
}

cmd_p12() {
  local cer="${1:-}"
  [ -n "$cer" ] || { echo "usage: ios-signing.sh p12 <downloaded .cer>" >&2; exit 1; }
  [ -f "$cer" ] || { echo "error: $cer not found" >&2; exit 1; }
  [ -f "$KEY" ] || { echo "error: $KEY not found — run 'csr' first" >&2; exit 1; }

  # Apple hands back DER; openssl needs PEM to bundle it.
  openssl x509 -inform DER -in "$cer" -out "$DIR/distribution.pem"

  echo "Choose a password for the .p12. You will store it as the"
  echo "IOS_CERTIFICATE_PASSWORD secret, so it can be anything — just not empty,"
  echo "which some versions of Xcode's importer reject."
  # The -certpbe/-keypbe/-macalg flags are not optional here. OpenSSL 3 defaults
  # to AES-256-CBC with a SHA-256 MAC, and macOS `security import` — which is
  # what the CI workflow runs — rejects that with an opaque "MAC verification
  # failed". The older 3DES/SHA-1 encoding is what Keychain expects.
  openssl pkcs12 -export \
    -inkey "$KEY" \
    -in "$DIR/distribution.pem" \
    -out "$P12" \
    -name "Apple Distribution" \
    -certpbe PBE-SHA1-3DES \
    -keypbe PBE-SHA1-3DES \
    -macalg sha1

  chmod 600 "$P12"
  rm -f "$DIR/distribution.pem"

  echo
  echo "Created $P12"
  echo "Verify it contains both the certificate and the key:"
  echo "  openssl pkcs12 -info -in $P12 -nodes -legacy -passin pass:YOURPASSWORD | grep -c 'BEGIN'"
  echo "Two or more 'BEGIN' blocks means it worked."
}

b64() {
  # -w0 is GNU-only; the -A form works on both GNU and BSD/macOS.
  openssl base64 -A -in "$1"
}

cmd_secrets() {
  local profile
  profile=$(find "$DIR" -name '*.mobileprovision' | head -1)

  echo "Paste these into GitHub → Settings → Secrets and variables → Actions."
  echo "Each value is a single line, however long it looks."
  echo

  if [ -f "$P12" ]; then
    echo "── IOS_CERTIFICATE_P12 ──"
    b64 "$P12"
    echo
  else
    echo "!! $P12 missing — run the csr and p12 steps first."
    echo
  fi

  if [ -n "$profile" ]; then
    echo "── IOS_PROVISIONING_PROFILE ──"
    b64 "$profile"
    echo
  else
    echo "!! No .mobileprovision in $DIR/ — download your App Store profile there."
    echo
  fi

  echo "── Still to add by hand ──"
  echo "  IOS_CERTIFICATE_PASSWORD   the password you chose in the p12 step"
  echo "  APPSTORE_KEY_ID            App Store Connect API key id"
  echo "  APPSTORE_ISSUER_ID         App Store Connect issuer id"
  echo "  APPSTORE_PRIVATE_KEY       full contents of the .p8, including the"
  echo "                             BEGIN/END lines"
  echo
  echo "── And one variable, not a secret ──"
  echo "  VITE_API_BASE_URL          absolute origin of your deployed API"
}

case "${1:-}" in
  csr) cmd_csr ;;
  p12) shift; cmd_p12 "$@" ;;
  secrets) cmd_secrets ;;
  *) usage ;;
esac
