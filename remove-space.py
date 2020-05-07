import sys
if (len(sys.argv) > 1):
    # first get all lines from file
    with open(sys.argv[1], 'r') as f:
        lines = f.readlines()
    # remove spaces
    lines = [line.replace(' ,', ',') for line in lines]
    lines = [line.replace(', ', ',') for line in lines]
    lines = [line.replace('  ', ' ') for line in lines]
    # finally, write lines in the file
    with open(sys.argv[1], 'w') as f:
        f.writelines(lines)
