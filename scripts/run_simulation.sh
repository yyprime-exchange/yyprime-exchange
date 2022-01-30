#!/bin/bash

pushd ../packages/simulation
yarn build-sim && yarn init-sim && yarn sim
popd
