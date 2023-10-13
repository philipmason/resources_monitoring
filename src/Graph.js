import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

function Graph(props) {
  const // destructuring objects
    { rows } = props,
    // make array into an array that just has the invoice amounts
    cpu = rows.map((d) => [new Date(d.date), Number(d.cpu_pct_used)]),
    mem = rows.map((d) => [new Date(d.date), Number(d.mem_pct_used)]),
    swap = rows.map((d) => [new Date(d.date), Number(d.swap_pct_used)]),
    transient = rows.map((d) => [
      new Date(d.date),
      Number(d.transient_pct_used),
    ]),
    saswork = rows.map((d) => [new Date(d.date), Number(d.saswork_pct_used)]),
    xythosfs = rows.map((d) => [new Date(d.date), Number(d.xythosfs_pct_used)]),
    // create options needed for graph - https://www.highcharts.com/demo
    options = {
      chart: {
        type: "spline", // column, spline, area, bar, scatter, etc.
      },
      title: {
        text: "Resources",
      },
      series: [
        { name: "CPU", data: cpu },
        { name: "Mem", data: mem },
        { name: "Swap", data: swap },
        { name: "Transient", data: transient },
        { name: "SASwork", data: saswork },
        { name: "Xythosfs", data: xythosfs },
      ],
      xAxis: {
        type: "datetime",
        // labels: {
        //   format: "{value:%Y-%b-%e}",
        // },
      },
    };
  console.log("props", props, "rows", rows, "options", options);

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export default Graph;
