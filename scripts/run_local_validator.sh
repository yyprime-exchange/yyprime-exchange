#!/bin/bash

PROGRAM_ID="9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"

solana-test-validator -r --bpf-program $PROGRAM_ID ../tests/deps/serum_dex.so
