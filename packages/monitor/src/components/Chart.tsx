import { time } from "console";
import React, { useContext, useState, useEffect, useMemo } from "react";
import Chart from "react-apexcharts";
import { PythContext } from "../utils/pyth";
import { SerumContext } from "../utils/serum";
import { useChart } from "../utils/useChart";

export const RealTimeChart = ({range,dataList,yrange}) => {
  const options = {
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
        easing: "easeout",
        dynamicAnimation: {
            enabled: true,
            speed: 300
        }
      },
      toolbar: {
        show: false
      }
    },

    colors: ["#0000FF", "#ff0000"],
    dataLabels: {
      enabled: false
    },
    stroke: {
    //   dashArray: [4, 4, 0, 0],
      width: [6, 1],
      curve: "smooth"
    },
    title: {
      text: "Pyth Price Vs. Serum Orderbook",
      align: "left"
    },
    // grid: {
    //   borderColor: "#e7e7e7",
    //   row: {
    //     colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
    //     opacity: 0.5
    //   }
    // },
    // markers: {
    //   size: 1
    // },
    legend: {
      enabled: false, 
      position: "top",
      horizontalAlign: "right",
      floating: true,
      offsetY: -10,
      offsetX: -5
    },
    subtitle: {
      align: "right"
    },
    tooltip: {
      theme: "dark",
      x: {
        show: true,
        format: "yyyy/MM/dd HH:mm:ss.f",
      },
    },
    xaxis: {
      type: "numeric",
      offsetX: 0,
      range: range,
    },
    yaxis: {
      labels: {
        show: true,
        formatter: (val) => val.toFixed(3),
        align: "right"
      },
      title: { text: "Price (USD)" },
      forceNiceScale: true,
      // min: yrange[0],
      // max: yrange[1]

    },
  };
  // @ts-ignore
  return <Chart key={'some-unique-key'} height="200px" type="line" options={options} series={dataList} />
};

const TIME_RANGE_IN_MILLISECONDS = 30 * 1000;
const ADDING_DATA_INTERVAL_IN_MILLISECONDS = 1000;
const ADDING_DATA_RATIO = 0.8;

export const InfoChart = () => {
  const chartData = useChart()
  const nameList = ["Pyth Price", "Serum Price"]
  // "Pyth Confidential Upward Bound", "Pyth Confidential Lower Bound", "Best Bid", "Best Ask"]
  
  const defaultDataList = nameList.map((name) => ({
    name: name,
    data: [],
  }));

  const [dataList, setDataList] = React.useState<any>(defaultDataList);

  useEffect(() => {
    const data = [
      {name: "Pyth Price", data: chartData.historicalPythPrice},
      {name: "Serum Price", data: chartData.historicalSerumPrice},
      // {name: "Pyth Confidential Upward Bound", data: chartData.con},
      // {name: "Pyth Confidential Lower Bound", data: []},
      // {name: "Best Bid", data: chartData.c},
      // {name: "Best Ask", data: []},

    ]
    const interval = setInterval(() => {
      setDataList(
        data
      );
    }, ADDING_DATA_INTERVAL_IN_MILLISECONDS);

    return () => clearInterval(interval);
  });

  return (useMemo(()=>  <div>
  <RealTimeChart
    dataList={dataList}
    range={10}
    yrange={0}
  />
</div>, [dataList])
   
  );
};

