"""No default training action. Each real-data mutating/evaluation stage requires an explicit switch."""
import os
for name in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS','NUMEXPR_NUM_THREADS'):
    os.environ[name]='1'
import argparse
import json
from .runner import preflight,fit_official,test_official,fictional_dry_run

parser=argparse.ArgumentParser(description=__doc__)
sub=parser.add_subparsers(dest='command',required=True)
pre=sub.add_parser('preflight');pre.add_argument('--data-root',required=True)
dry=sub.add_parser('fictional-dry-run');dry.add_argument('--run-root',required=True);dry.add_argument('--ledger-root',required=True)
fit=sub.add_parser('fit');fit.add_argument('--data-root',required=True);fit.add_argument('--run-root',required=True)
fit.add_argument('--execute-official-fitting',action='store_true')
test=sub.add_parser('test');test.add_argument('--data-root',required=True);test.add_argument('--run-root',required=True)
test.add_argument('--ledger-root',required=True);test.add_argument('--execute-locked-test',action='store_true')
args=parser.parse_args()
if args.command=='preflight':result=preflight(args.data_root)
elif args.command=='fictional-dry-run':result=fictional_dry_run(args.run_root,args.ledger_root)
elif args.command=='fit':result=fit_official(args.data_root,args.run_root,args.execute_official_fitting)
else:result=test_official(args.data_root,args.run_root,args.ledger_root,args.execute_locked_test)
print(json.dumps(result,sort_keys=True,allow_nan=False))
