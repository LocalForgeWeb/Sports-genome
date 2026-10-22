import sys, unittest
pkg = sys.argv[1]
sys.path.insert(0, pkg)
suite = unittest.defaultTestLoader.discover(pkg, pattern='test_model.py', top_level_dir=pkg)
r = unittest.TextTestRunner(verbosity=1).run(suite)
sys.exit(0 if r.wasSuccessful() else 1)
