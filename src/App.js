import "./App.css";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { DataGridPro, LicenseInfo } from "@mui/x-data-grid-pro";
import { usePapaParse } from "react-papaparse";
import localDay1 from "./test/day1.csv";
import localDay2 from "./test/day2.csv";
import localDay3 from "./test/day3.csv";
import localDay4 from "./test/day4.csv";
import localDay5 from "./test/day5.csv";
import localDay6 from "./test/day6.csv";
import localDay7 from "./test/day7.csv";
import Graph from "./Graph";
LicenseInfo.setLicenseKey(
  "369a1eb75b405178b0ae6c2b51263cacTz03MTMzMCxFPTE3MjE3NDE5NDcwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
);
function App() {
  document.title = "Resources Monitoring";
  const { readString } = usePapaParse(),
    { href, protocol, host } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    urlPrefix = protocol + "//" + host,
    [day1, setDay1] = useState([]),
    [day2, setDay2] = useState([]),
    [day3, setDay3] = useState([]),
    [day4, setDay4] = useState([]),
    [day5, setDay5] = useState([]),
    [day6, setDay6] = useState([]),
    [day7, setDay7] = useState([]),
    [cols, setCols] = useState([]),
    [rows, setRows] = useState([]),
    processCsv = (data, day) => {
      readString(data, {
        worker: true,
        complete: (results) => {
          // take papaparse results and transform them to fit DataGridPro
          const keys = results.data[0],
            tempRows = results.data
              .map((r, id) => {
                const tr = { id: day * 10000 + id };
                for (let i = 0; i < keys.length; i++) {
                  if (keys[i] === "date" && r[i] && r[i].length > 20) {
                    // console.log(keys[i], r[i], r[i].substring(0, 19));
                    tr[keys[i]] = r[i].substring(0, 19);
                  } else {
                    tr[keys[i]] = r[i];
                  }
                }
                return tr;
              })
              .filter((r, seq) => r.id !== 0 && seq !== 0);
          console.log("processCsv", day, "tempRows", tempRows);
          if (day === 1) setDay1(tempRows);
          else if (day === 2) setDay2(tempRows);
          else if (day === 3) setDay3(tempRows);
          else if (day === 4) setDay4(tempRows);
          else if (day === 5) setDay5(tempRows);
          else if (day === 6) setDay6(tempRows);
          else setDay7(tempRows);
          setCols(keys.map((k) => ({ field: k })));
        },
      });
    },
    addLocalRows = (day) => {
      // const csv = "./test/day" + day + ".csv";
      const csv =
        day === 1
          ? localDay1
          : day === 2
          ? localDay2
          : day === 3
          ? localDay3
          : day === 4
          ? localDay4
          : day === 5
          ? localDay5
          : day === 6
          ? localDay6
          : localDay7;
      fetch(csv)
        .then((response) => response.text())
        .then((data) => {
          processCsv(data, day);
        });
    };

  useEffect(() => {
    if (mode === "local") {
      setRows([]);
      addLocalRows(1);
      addLocalRows(2);
      addLocalRows(3);
      addLocalRows(4);
      addLocalRows(5);
      addLocalRows(6);
      addLocalRows(7);
    } else {
      fetch(urlPrefix + "/day1.csv")
        .then((response) => response.text())
        .then((data) => {
          processCsv(data);
        });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (day1 && day2 && day3 && day4 && day5 && day6 && day7) {
      setRows(day1.concat(day2, day3, day4, day5, day6, day7));
    }
  }, [day1, day2, day3, day4, day5, day6, day7]);

  return (
    <div className="App">
      <Box>LSAF Resource Usage</Box>
      {day1 &&
        day2 &&
        day3 &&
        day4 &&
        day5 &&
        day6 &&
        day7 &&
        rows.length > 0 && <Graph rows={rows} />}
      {rows && cols && <DataGridPro rows={day1} columns={cols} />}
    </div>
  );
}

export default App;
