import sys, unittest
sys.path.insert(0, sys.argv[1])
suite = unittest.defaultTestLoader.loadTestsFromName("test_model")
r = unittest.TextTestRunner(verbosity=1).run(suite)
print("ran", r.testsRun, "failures", len(r.failures), "errors", len(r.errors))
