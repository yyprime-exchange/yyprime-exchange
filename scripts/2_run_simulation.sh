#!/bin/bash

cd ../packages/ts
yarn && yarn build

cd ../simulation
yarn && yarn build-sim && yarn init-sim && yarn sim
