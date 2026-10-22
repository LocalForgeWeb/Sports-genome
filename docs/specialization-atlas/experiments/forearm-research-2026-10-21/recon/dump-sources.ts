import { sourceLibrary } from "/home/user/Sports-genome/shared/specialization/sources/index";
import { writeFileSync } from "node:fs";
writeFileSync(process.argv[2], JSON.stringify(sourceLibrary, null, 1));
console.log(sourceLibrary.length);
for (const s of sourceLibrary) console.log(s.id, "|", s.url, "|", s.doi, "|", s.title.slice(0,110));
