#!/bin/bash

cd ../packages/ts && yarn && yarn build &&
  cd ../simulation && yarn &&
  cd ../monitor && yarn && yarn start
