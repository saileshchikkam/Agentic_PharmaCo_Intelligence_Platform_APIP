"""Non-executing pickle opcode inspection. Never imports pickle/joblib loaders."""
from collections import Counter
import pickletools
from ..core.exceptions import EvidenceRejected


def literal_string_list(data):
    """Accept exactly the observed string-list grammar, not arbitrary pickle objects."""
    if not isinstance(data, bytes) or len(data) > 65536:
        raise EvidenceRejected('INVALID_LITERAL_VOCABULARY')
    try:
        ops = list(pickletools.genops(data))
        names = [op.name for op, _, _ in ops]
        if names[:5] != ['PROTO','FRAME','EMPTY_LIST','MEMOIZE','MARK'] or names[-2:] != ['APPENDS','STOP']:
            raise ValueError('grammar')
        if ops[0][1] not in (4,5) or ops[1][1] != len(data)-11 or ops[-1][2] != len(data)-1:
            raise ValueError('trailing_bytes')
        middle = ops[5:-2]
        if len(middle) % 2 or any(middle[i][0].name != 'SHORT_BINUNICODE' or middle[i+1][0].name != 'MEMOIZE'
                                  for i in range(0,len(middle),2)):
            raise ValueError('nonliteral')
        values = tuple(middle[i][1] for i in range(0,len(middle),2))
        if not values or len(values) != len(set(values)):
            raise ValueError('duplicates')
        return values
    except (ValueError, TypeError, IndexError, UnicodeError):
        raise EvidenceRejected('NONLITERAL_OR_INVALID_VOCABULARY') from None


def opcode_summary(data):
    counts = Counter(); end = 0; stopped = False; error = None
    try:
        for op, arg, pos in pickletools.genops(data):
            counts[op.name] += 1; end = pos+1
            if op.name == 'STOP': stopped = True
    except Exception as exc:
        error = type(exc).__name__
    return {'bytes':len(data),'parsed_through':end,'trailing_bytes':len(data)-end,
            'stop_seen':stopped,'parse_error':error,'opcode_counts':dict(counts),
            'object_construction_present':any(counts[k] for k in ('GLOBAL','STACK_GLOBAL','REDUCE','NEWOBJ','BUILD')),
            'safe_to_deserialize':False}
