#!/bin/bash

cd ../packages/ts
yarn && yarn build
cd ../../scripts

cd ../packages/simulation
yarn && yarn build-sim && yarn init-sim && yarn sim
cd ../../scripts
