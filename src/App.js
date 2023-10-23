import "./App.css";
import { useState, useEffect } from "react";
import {
  Snackbar,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
  Button,
  Box,
} from "@mui/material";
import { Info } from "@mui/icons-material";
import { DataGridPro, GridToolbar, LicenseInfo } from "@mui/x-data-grid-pro";
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
    webDavPrefix = urlPrefix + "/lsaf/webdav/repo", // prefix for webdav access to LSAF
    [day1, setDay1] = useState(null),
    [day2, setDay2] = useState(null),
    [day3, setDay3] = useState(null),
    [day4, setDay4] = useState(null),
    [day5, setDay5] = useState(null),
    [day6, setDay6] = useState(null),
    [day7, setDay7] = useState(null),
    [cols, setCols] = useState([]),
    [rows, setRows] = useState(null),
    [filteredRows, setFilteredRows] = useState([]),
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
          // console.log("processCsv", day, "tempRows", tempRows);
          if (day === 1) setDay1(tempRows.filter((r) => r.date));
          else if (day === 2) setDay2(tempRows.filter((r) => r.date));
          else if (day === 3) setDay3(tempRows.filter((r) => r.date));
          else if (day === 4) setDay4(tempRows.filter((r) => r.date));
          else if (day === 5) setDay5(tempRows.filter((r) => r.date));
          else if (day === 6) setDay6(tempRows.filter((r) => r.date));
          else setDay7(tempRows.filter((r) => r.date));
          // setCols(keys.map((k) => ({ field: k })));
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
    },
    addRemoteRows = (day) => {
      const csv =
        webDavPrefix +
        "/general/biostat/metadata/projects/resources_monitoring/day" +
        day +
        ".csv";
      fetch(csv)
        .then((response) => response.text())
        .then((data) => {
          processCsv(data, day);
        });
    },
    green = "rgba(128, 255, 128, 0.5)",
    [minMax, setMinMax] = useState({}),
    [reload, setReload] = useState(true),
    [reloadRemoteEvery, setReloadRemoteEvery] = useState(300000), // default 5 minutes
    [openSnackbar, setOpenSnackbar] = useState(false),
    handleCloseSnackbar = () => {
      setOpenSnackbar(false);
    },
    buffer = 1000 * 60 * 60, // 1 hour
    filterRows = (date) => {
      const d = Number(date),
        low = new Date(d - buffer),
        high = new Date(d + buffer),
        filtered = rows.filter((r) => {
          const d = new Date(r.date);
          if (d < high && d > low) {
            return true;
          } else return false;
        });
      // console.log(
      //   "filterRows",
      //   "low",
      //   low,
      //   "date",
      //   date,
      //   "high",
      //   high,
      //   "filtered",
      //   filtered
      // );
      setFilteredRows(filtered);
    },
    renderProgress = (cellValues) => {
      // console.log(cellValues, minMax);
      const { field, value } = cellValues,
        flex =
          (value - minMax[field].min) / (minMax[field].max - minMax[field].min),
        avg = minMax[field].sum / minMax[field].n,
        low =
          field === "mem_pct_used"
            ? 18
            : field === "swap_pct_used"
            ? 17.5
            : field === "xythosfs_pct_used"
            ? 40
            : avg / 2,
        high =
          field === "mem_pct_used"
            ? 20
            : field === "swap_pct_used"
            ? 20
            : field === "xythosfs_pct_used"
            ? 42
            : avg * 2;

      const backgroundColor =
        Number(value) <= low
          ? "#80ffbf"
          : Number(value) >= high
          ? "#ffcccc"
          : "#cce6ff";

      return (
        <Box
          sx={{
            flex: { flex },
            backgroundColor: backgroundColor,
            color: "black",
          }}
        >
          {value}
        </Box>
      );
    },
    [openInfo, setOpenInfo] = useState(false); // shows dialog with info about this screen

  useEffect(() => {
    if (!reload) return;
    setReload(false);
    setOpenSnackbar(true);
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
      setRows([]);
      addRemoteRows(1);
      addRemoteRows(2);
      addRemoteRows(3);
      addRemoteRows(4);
      addRemoteRows(5);
      addRemoteRows(6);
      addRemoteRows(7);
      setTimeout(() => {
        setReload(true);
      }, reloadRemoteEvery);
    }
    // eslint-disable-next-line
  }, [reload]);

  useEffect(() => {
    if (!rows || rows.length === 0 || Object.keys(minMax).length < 5) return;
    console.log("minMax", minMax);
    setCols([
      { field: "date", headerName: "Date", width: 150 },
      {
        field: "cpu_pct_used",
        headerName: "CPU",
        width: 160,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "mem_pct_used",
        headerName: "Memory",
        width: 160,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "swap_pct_used",
        headerName: "Swap",
        width: 160,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "transient_pct_used",
        headerName: "Transient",
        width: 160,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "saswork_pct_used",
        headerName: "SAS work",
        width: 160,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "xythosfs_pct_used",
        headerName: "Xythos FS",
        width: 160,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
    ]);
    // eslint-disable-next-line
  }, [rows, minMax]);

  useEffect(() => {
    if (day1 && day2 && day3 && day4 && day5 && day6 && day7) {
      const tempRows = day1
        .concat(day2, day3, day4, day5, day6, day7)
        .sort((a, b) => {
          if (a.date > b.date) return 1;
          if (a.date < b.date) return -1;
          return 0;
        });
      // console.log("tempRows", tempRows);
      // work out the min and max for each column and put into an object
      const tempMinMax = {};
      tempRows.forEach((row) => {
        const keys = Object.keys(row);
        keys.forEach((key) => {
          // console.log(acc, xx, ind, key, row[key]);
          if (key !== "id" && key !== "date") {
            if (!tempMinMax[key])
              tempMinMax[key] = { min: 100, max: 0, n: 0, sum: 0 };
            if (Number(row[key]) < tempMinMax[key].min)
              tempMinMax[key].min = Number(row[key]);
            if (Number(row[key]) > tempMinMax[key].max)
              tempMinMax[key].max = Number(row[key]);
            tempMinMax[key].n = tempMinMax[key].n + 1;
            tempMinMax[key].sum = tempMinMax[key].sum + Number(row[key]);
          }
        });
      });
      console.log("tempMinMax", tempMinMax);
      // work out average interval between dates
      const interval =
        tempRows
          .slice(0, 10)
          .map((r, i) => {
            const diff =
              new Date(tempRows[i].date) - new Date(tempRows[i + 1].date);
            return diff;
          })
          .reduce((a, b) => a + b) / 10;
      setReloadRemoteEvery(interval);
      console.log("Interval between reloads set to", interval, "ms");
      setRows(tempRows);
      setFilteredRows(tempRows);
      setMinMax(tempMinMax);
    }
    // eslint-disable-next-line
  }, [day1, day2, day3, day4, day5, day6, day7]);

  return (
    <div className="App">
      <Tooltip title="Information about this screen">
        <IconButton
          color="info"
          sx={{ position: "fixed", top: 2, right: 2, zIndex: 100 }}
          onClick={() => {
            setOpenInfo(true);
          }}
        >
          <Info />
        </IconButton>
      </Tooltip>
      {/* <Box>LSAF Resource Usage</Box> */}
      {day1 &&
        day2 &&
        day3 &&
        day4 &&
        day5 &&
        day6 &&
        day7 &&
        rows.length > 0 && <Graph rows={rows} filterRows={filterRows} />}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Data updated"
      />
      {filteredRows && cols && (
        <DataGridPro
          rows={filteredRows}
          columns={cols}
          density="compact"
          rowHeight={22}
          sx={{
            // height: windowDimension.winHeight - topMargin,
            fontFamily: "system-ui;",
            fontWeight: "fontSize=5",
            fontSize: "0.7em",
            padding: 0.1,
            "& .MuiDataGrid-columnHeaderTitle": {
              whiteSpace: "normal",
              lineHeight: "normal",
            },
            "& .MuiDataGrid-columnHeader": {
              // Forced to use important since overriding inline styles
              height: "unset !important",
            },
            "& .MuiDataGrid-columnHeaders": {
              // Forced to use important since overriding inline styles
              maxHeight: "168px !important",
            },
            "& .MuiDataGrid-cell": {
              // Forced to use important since overriding inline styles
              whiteSpace: "unset !important",
            },
            "& .green": {
              backgroundColor: green,
              color: "#000000",
            },
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
          }
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          // pageSizeOptions={[10, 25, 50, 100]}
          // pagination
        />
      )}
      {/* Dialog with General info about this screen */}
      <Dialog
        fullWidth
        maxWidth="xl"
        onClose={() => setOpenInfo(false)}
        open={openInfo}
        title={"Info about this screen"}
      >
        <DialogTitle>Info about this screen</DialogTitle>
        <DialogContent>
          <ul>
            <li>
              Data for this report is produced by an LSAF job that runs every 5
              minutes located here:{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/utils/dev/jobs/job_resource_monitor.job"
                target="_blank"
                rel="noreferrer"
              >
                job_resource_monitor.job
              </a>
            </li>
            <li>
              The SAS program used to get stats is here:{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/utils/dev/programs/resource_monitor.sas"
                target="_blank"
                rel="noreferrer"
              >
                resource_monitor.sas
              </a>
            </li>
            <li>
              Clicking on the graph will filter the table to an hour either side
              of the time you click on. This allows investigating the time
              around the point you select.
            </li>
          </ul>
          <Tooltip title={"Email technical programmers"}>
            <Button
              sx={{
                color: "blue",
                border: 1,
                borderColor: "blue",
                borderRadius: 1,
                padding: 0.4,
                float: "right",
              }}
              onClick={() => {
                window.open(
                  "mailto:qs_tech_prog@argenx.com?subject=Question&body=This email was sent from: " +
                    encodeURIComponent(href) +
                    "%0D%0A%0D%0AMy question is:",
                  "_blank"
                );
              }}
            >
              Email
            </Button>
          </Tooltip>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
