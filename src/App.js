import "./App.css";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { DataGridPro, LicenseInfo } from "@mui/x-data-grid-pro";
import { usePapaParse } from "react-papaparse";
import sashelp from "./sashelp.json";
import localCsv from "./day6.csv";
import Graph from "./Graph";
LicenseInfo.setLicenseKey(
  "369a1eb75b405178b0ae6c2b51263cacTz03MTMzMCxFPTE3MjE3NDE5NDcwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
);
function App() {
  document.title = "Resources Monitoring";
  const { readString } = usePapaParse(),
    [cols, setCols] = useState([
      { field: "Name" },
      { field: "Sex" },
      { field: "Age" },
      { field: "Height" },
      { field: "Weight" },
    ]),
    [rows, setRows] = useState(
      sashelp.class.map((r, id) => {
        return { id: id, ...r };
      })
    );

  useEffect(() => {
    fetch(localCsv)
      .then((response) => response.text())
      .then((data) => {
        console.log(data);
        readString(data, {
          worker: true,
          complete: (results) => {
            // take papaparse results and transform them to fit DataGridPro
            const keys = results.data[0],
              tempRows = results.data
                .map((r, id) => {
                  const tr = { id: id };
                  for (let i = 0; i < keys.length; i++) {
                    tr[keys[i]] = r[i];
                  }
                  return tr;
                })
                .filter((r) => r.id !== 0);
            console.log("---------------------------");
            console.log(tempRows);
            console.log("---------------------------");
            setRows(tempRows);
            setCols(keys.map((k) => ({ field: k })));
          },
        });
      });
  }, [readString]);

  return (
    <div className="App">
      <Box>LSAF Resource Usage</Box>
      <DataGridPro rows={rows} columns={cols} />
      <Graph rows={rows} />
    </div>
  );
}

export default App;
