import React, { useEffect } from "react";
import Chart from "react-apexcharts";

import FloatingElement from "./layout/FloatingElement";
import { Title } from './styles';
import { usePythPrice } from "../utils/pyth";
import { useSerumQuote } from "../utils/serum";

export const RealTimeChart = ({range,yrange}) => {
  const { price, confidence } = usePythPrice();

  const { bestBid, bestAsk } = useSerumQuote();
  const midPrice = (bestBid && bestAsk) ? (bestBid + bestAsk) / 2 : null;

  const currTime = new Date();

  const nameList = [ "Pyth Price", "Pyth Lower", "Pyth Upper", "Serum MidPrice", "Serum Best Bid", "Serum Best Ask" ]

  const defaultDataList = nameList.map((name) => ({
    name: name,
    data: [],
  }));

  const [dataList, setDataList] = React.useState<any>(defaultDataList);

  const dataObj = {
    "Pyth Price": price,
    "Pyth Lower": (price && confidence) ? price - confidence : null,
    "Pyth Upper": (price && confidence) ? price + confidence : null,
    "Serum MidPrice": midPrice,
    "Serum Best Bid": bestBid,
    "Serum Best Ask": bestAsk,
  }

  useEffect(() => {
    const addData = (name, data) => {
      return [
        ...data,
        {
          x: currTime,
          y: dataObj[name]
        }
      ];
    };
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
          speed: 1000
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
      width: [6, 1],
      curve: "smooth"
    },
    legend: {
      enabled: false,
      position: "top",
      horizontalAlign: "right",
      floating: true,
      offsetY: -10,
      offsetX: -5
    },
    tooltip: {
      theme: "dark",
      x: {
        show: true,
        format: "yyyy/MM/dd HH:mm:ss.f",
      },
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

const ADDING_DATA_INTERVAL_IN_MILLISECONDS = 1000;

export const InfoChart = () => {
  return (
    <RealTimeChart range={10} yrange={0} />
  );
};

export default function PriceChart() {
  return (
    <FloatingElement style={{ width: '600px', height: '400px' }}>
      <Title>Pyth vs. Serum</Title>
      <InfoChart/>
    </FloatingElement>
  );
}
