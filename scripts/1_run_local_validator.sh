#!/bin/bash

#solana program dump -u m 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin ../tests/deps/serum_dex_v3.so

PROGRAM_ID="2SXFv8tTmavm8uSAg3ft1JjttzJvgwXZiUPa9xuUbqH2"

solana-test-validator --reset --bpf-program $PROGRAM_ID ../tests/deps/serum_dex_v3.so
