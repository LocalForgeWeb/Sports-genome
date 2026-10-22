import sys, unittest
sys.path.insert(0, sys.argv[1])
import test_model
suite = unittest.defaultTestLoader.loadTestsFromModule(test_model)
r = unittest.TextTestRunner(verbosity=1).run(suite)
print('ran', r.testsRun, 'failures', len(r.failures), 'errors', len(r.errors))
