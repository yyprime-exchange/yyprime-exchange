import { time } from "console";
import React, { useContext, useState, useEffect, useMemo } from "react";
import Chart from "react-apexcharts";
import { PythContext } from "../utils/pyth";
import { SerumContext } from "../utils/serum";
import { useChart } from "../utils/useChart";

export const RealTimeChart = ({range,yrange}) => {
  const { price, currentMarkPrice, confidence, bestBid, bestAsk, currTime } = useChart()
  const nameList = ["Pyth Price", "Serum Price", "Pyth Confidence(upper)", "Pyth Confidence(lower)", "Best Bid", "Best Ask"]
  
  const defaultDataList = nameList.map((name) => ({
    name: name,
    data: [],
  }));

  const [dataList, setDataList] = React.useState<any>(defaultDataList);
  // console.log(price, currentMarkPrice, confidence, "CHART INFO")
  const dataObj = {"Pyth Price": price, "Serum Price": currentMarkPrice, 
        "Pyth Confidential Upward Bound": price! + confidence!, "Pyth Confidential Lower Bound": price! - confidence!, 
        "Best Bid": bestBid, "Best Ask": bestAsk}

  useEffect(() => {
    const addData = (name, data) => {
      return [
        ...data,
        {
          x: currTime,
          y: dataObj[name]?.toFixed(3)
        }
      ];
    };
    // const data = [
      // {name: "Pyth Price", data: chartData.historicalPythPrice},
      // {name: "Serum Price", data: chartData.historicalSerumPrice},
      // {name: "Pyth Confidential Upward Bound", data: chartData.con},
      // {name: "Pyth Confidential Lower Bound", data: []},
      // {name: "Best Bid", data: chartData.c},
      // {name: "Best Ask", data: []},
    // ]
    // data.map((series) => series.data)
    const interval = setInterval(() => {
  
      setDataList(
        dataList.map(val => {
          return {
            name: val.name,
            data: addData(val.name, val.data)
          };
        })
      );
    }, ADDING_DATA_INTERVAL_IN_MILLISECONDS);

    return () => clearInterval(interval);
  });
  const options = {
    tooltip: {
      enabled: true, 
      theme: "dark",
      shared: false,
      x: {
        show: true,
        format: "yyyy/MM/dd HH:mm:ss.f",
      },
    },
    zoom: {
      enabled: false
    },
    chart: {
      foreColor: "#FFFFFF",
      type: "line",
      dropShadow: {
        enabled: true,
        color: "#000",
        top: 100,
        left: 7,
        blur: 10,
        opacity: 0.2
      },
      animations: {
        enabled: true,
        easing: "linear",
        dynamicAnimation: {
            enabled: true,
            speed: 300
        }
      },
      toolbar: {
        show: false
      }
    },

    colors: ["#0000FF", "#ff0000",  "#953553", "#953553", "#FFA500", "#FFA500",],
    // dataLabels: {
    //   enabled: true,
    //   enabledOnSeries: [0, 1]
    // },
    stroke: {
      dashArray: [0, 0, 4, 4, 4, 4],
      width: [6, 2],
      curve: "smooth"
    },
    legend: {
      enabled: true, 
      position: "top",
      offsetY: 5,
    },
    subtitle: {
      align: "right"
    },

    xaxis: {
      type: "datetime",
      offsetX: 0,
    },
    yaxis: {
      labels: {
        show: true,
        formatter: (val) => val.toFixed(3),
        align: "right"
      },
      title: { text: "Price (USD)" },
      forceNiceScale: true,
    },
  };
  // @ts-ignore
  return <Chart key={'some-unique-key'} height="300px" type="line" options={options} series={dataList} />
};

const TIME_RANGE_IN_MILLISECONDS = 30 * 1000;
const ADDING_DATA_INTERVAL_IN_MILLISECONDS = 1000;
const ADDING_DATA_RATIO = 0.8;

export const InfoChart = () => {

return(  <RealTimeChart
  range={10}
  yrange={0}
/>)
};

