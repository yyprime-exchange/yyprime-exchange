#!/bin/bash

PROGRAM_ID="2SXFv8tTmavm8uSAg3ft1JjttzJvgwXZiUPa9xuUbqH2"

solana-test-validator -r --bpf-program $PROGRAM_ID ../tests/deps/serum_dex.so
