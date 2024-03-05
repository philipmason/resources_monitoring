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
  Switch,
  FormControlLabel,
  Slider,
} from "@mui/material";
import {
  ArrowLeftRounded,
  ArrowRightRounded,
  CalendarMonth,
  Info,
} from "@mui/icons-material";
import { DataGridPro, GridToolbar, LicenseInfo } from "@mui/x-data-grid-pro";
import { usePapaParse } from "react-papaparse";
import localDay1 from "./test/day1.csv";
import localDay2 from "./test/day2.csv";
import localDay3 from "./test/day3.csv";
import localDay4 from "./test/day4.csv";
import localDay5 from "./test/day5.csv";
import localDay6 from "./test/day6.csv";
import localDay7 from "./test/day7.csv";
import past_week from "./test/past_week.csv";
import past_week_versions from "./test/past_week_versions.json";
import Graph from "./Graph";
LicenseInfo.setLicenseKey(
  "369a1eb75b405178b0ae6c2b51263cacTz03MTMzMCxFPTE3MjE3NDE5NDcwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
);
function App() {
  document.title = "Resources Monitoring";
  const { readString } = usePapaParse(),
    { href, protocol, host } = window.location,
    [useUTC, setUseUTC] = useState(true),
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    urlPrefix = protocol + "//" + host,
    webDavPrefix = urlPrefix + "/lsaf/webdav/repo", // prefix for webdav access to LSAF - ignores versions
    fileDownloadPrefix = urlPrefix + "/lsaf/filedownload/sdd%3A//", // prefix for file download access to LSAF - respects versions
    [day1, setDay1] = useState(null),
    [day2, setDay2] = useState(null),
    [day3, setDay3] = useState(null),
    [day4, setDay4] = useState(null),
    [day5, setDay5] = useState(null),
    [day6, setDay6] = useState(null),
    [day7, setDay7] = useState(null),
    [loadDays, setLoadDays] = useState(true),
    [daysSelected, setDaysSelected] = useState(7),
    [cols, setCols] = useState([]),
    [rows, setRows] = useState(null),
    [filteredRows, setFilteredRows] = useState([]),
    [timeout1, setTimeout1] = useState(null),
    [versions, setVersions] = useState(null),
    [selectedVersion, setSelectedVersion] = useState(null), // if not null, then use this version instead of latest
    marks = [
      {
        value: 1,
        label: "1 day",
      },
      {
        value: 2,
        label: "2 days",
      },
      {
        value: 3,
        label: "3 days",
      },
      {
        value: 4,
        label: "4 days",
      },
      {
        value: 5,
        label: "5 days",
      },
      {
        value: 6,
        label: "6 days",
      },
      {
        value: 7,
        label: "1 week",
      },
    ],
    [offset, setOffset] = useState(0),
    processCsv = (data, day, dayArray) => {
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
                    // tr[keys[i]] = r[i].substring(0, 19);
                    tr[keys[i]] = r[i];
                  } else {
                    tr[keys[i]] = r[i];
                  }
                }
                return tr;
              })
              .filter((r, seq) => r.id !== 0 && seq !== 0);
          // console.log("processCsv", day, "tempRows", tempRows);
          if (day === 1) setDay1(tempRows.filter((r) => r.date));
          else if (day === 2 || dayArray === 2)
            setDay2(tempRows.filter((r) => r.date));
          else if (day === 3 || dayArray === 3)
            setDay3(tempRows.filter((r) => r.date));
          else if (day === 4 || dayArray === 4)
            setDay4(tempRows.filter((r) => r.date));
          else if (day === 5 || dayArray === 5)
            setDay5(tempRows.filter((r) => r.date));
          else if (day === 6 || dayArray === 6)
            setDay6(tempRows.filter((r) => r.date));
          else if (day === 7 || dayArray === 7)
            setDay7(tempRows.filter((r) => r.date));
          else if (day === "*") {
            setDay1(tempRows.filter((r) => r.date));
            setDay2([]);
            setDay3([]);
            setDay4([]);
            setDay5([]);
            setDay6([]);
            setDay7([]);
          }
          // setCols(keys.map((k) => ({ field: k })));
        },
      });
    },
    addRows = (day) => {
      console.log("addRows", day);
      if (mode === "local") {
        addLocalRows(day);
      } else {
        if (day === "M") addLastMonth();
        else addRemoteRows(day, null);
      }
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
          : day === 7
          ? localDay7
          : past_week;
      console.log("> addLocalRows - csv", csv);
      fetch(csv)
        .then((response) => response.text())
        .then((data) => {
          processCsv(data, day);
        });
    },
    addLastMonth = () => {
      // add the previous 5 weeks
      versions.forEach((v, vi) => {
        if (vi > 4) return;
        const dayArray = (vi = 0 ? "*" : vi + 1);
        setTimeout(() => {
          addRemoteRows("*", v, dayArray);
        }, 1000 * vi);
      });
    },
    addRemoteRows = (day, version, dayArray) => {
      const f = day === "*" ? "past_week" : "day" + day,
        v = version
          ? "?version=" + version
          : day === "*" && selectedVersion
          ? "?version=" + selectedVersion
          : "",
        csv =
          fileDownloadPrefix +
          "/general/biostat/metadata/projects/resources_monitoring/" +
          f +
          ".csv" +
          v;
      console.log(
        "> addRemoteRows - ",
        "csv",
        csv,
        "selectedVersion",
        selectedVersion,
        "v",
        v
      );
      fetch(csv)
        .then((response) => response.text())
        .then((data) => {
          if (dayArray) processCsv(data, day, dayArray);
          else processCsv(data, day);
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
          // field === "mem_pct_used"
          //   ? 25
          // : field === "swap_pct_used"
          // ? 17.5
          // : field === "xythosfs_pct_used"
          // ? 40
          avg - minMax[field].stdDev,
        high =
          // field === "mem_pct_used"
          //   ? 75
          // : field === "swap_pct_used"
          // ? 20
          // : field === "xythosfs_pct_used"
          // ? 42
          avg + minMax[field].stdDev;

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
    getWeek = () => {
      setRows([]);
      setLoadDays(true);
      addRows("1");
      addRows("2");
      addRows("3");
      addRows("4");
      addRows("5");
      addRows("6");
      addRows("7");
    },
    [openInfo, setOpenInfo] = useState(false), // shows dialog with info about this screen
    [openDateSelector, setOpenDateSelector] = useState(false); // shows dialog with date selector

  useEffect(() => {
    // if (!reload) return;
    // console.log(
    //   "useEffect - reload",
    //   reload,
    //   "selectedVersion",
    //   selectedVersion
    // );
    setReload(false);
    setOpenSnackbar(true);
    if (mode === "local") {
      setRows([]);
      if (loadDays) {
        addLocalRows(1);
        addLocalRows(2);
        addLocalRows(3);
        addLocalRows(4);
        addLocalRows(5);
        addLocalRows(6);
        addLocalRows(7);
      } else {
        addLocalRows("*");
      }
    } else {
      // remote
      setRows([]);
      if (loadDays) {
        addRemoteRows(1, null);
        addRemoteRows(2, null);
        addRemoteRows(3, null);
        addRemoteRows(4, null);
        addRemoteRows(5, null);
        addRemoteRows(6, null);
        addRemoteRows(7, null);
      } else {
        addRemoteRows("*", null);
      }
      // clear any existing timeout, and set a new one to auto update
      if (timeout1) clearTimeout(timeout1);
      const to = setTimeout(() => {
        setReload(true);
      }, reloadRemoteEvery);
      setTimeout1(to);
    }
    // eslint-disable-next-line
  }, [reload, selectedVersion]);

  // get the list of versions
  useEffect(() => {
    if (mode === "local") {
      setVersions(past_week_versions);
    } else {
      fetch(
        webDavPrefix +
          "/general/biostat/metadata/projects/resources_monitoring/past_week_versions.json"
      )
        .then((response) => response.text())
        .then((data) => {
          setVersions(JSON.parse(data));
        });
    }
  }, [webDavPrefix, mode]);

  useEffect(() => {
    if (!rows || rows.length === 0 || Object.keys(minMax).length < 15) return;
    // console.log("minMax", minMax);
    setCols([
      { field: "date", headerName: "Date", width: 200 },
      {
        field: "cpu_pct_used",
        headerName: "CPU",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "mem_pct_used",
        headerName: "Memory",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "swap_pct_used",
        headerName: "Swap",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "transient_pct_used",
        headerName: "Transient",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "saswork_pct_used",
        headerName: "SAS work",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "workspace_pct_used",
        headerName: "Workspace",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "xythosfs_pct_used",
        headerName: "Xythos FS",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "TotalRecvQ_bytes",
        headerName: "RecvQ bytes",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "TotalSendQ_bytes",
        headerName: "SendQ bytes",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "usockets_servers",
        headerName: "# Unix Sockets (Server)",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "usockets_connections",
        headerName: "Unix Sockets (connections)",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "tcp_active_connections",
        headerName: "TCP active connections",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "tcp_inactive_connections",
        headerName: "TCP inactive connections",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "active_https_conn",
        headerName: "HTTPS active connections",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
      {
        field: "inactive_https_conn",
        headerName: "HTTPS inactive connections",
        width: 80,
        type: "number",
        renderCell: (cellValues) => {
          return renderProgress(cellValues);
        },
      },
    ]);
    // TotalRecvQ_bytes,TotalSendQ_bytes,
    // usockets_servers,usockets_connections,tcp_active_connections,tcp_inactive_connections,active_https_conn,inactive_https_conn
    // eslint-disable-next-line
  }, [rows, minMax]);

  useEffect(() => {
    if (day1 && day2 && day3 && day4 && day5 && day6 && day7) {
      const tempRows0 = day1
        .concat(day2, day3, day4, day5, day6, day7)
        .sort((a, b) => {
          if (a.date > b.date) return 1;
          if (a.date < b.date) return -1;
          return 0;
        });

      // apply filter on days selected from slider
      const maxDate = new Date(
          tempRows0.reduce((prev, curr) =>
            prev.date > curr.date ? prev : curr
          ).date
        ),
        // minDate = new Date(
        //   tempRows0.reduce((prev, curr) =>
        //     prev.date < curr.date ? prev : curr
        //   ).date
        // ),
        fromDate = new Date(
          new Date(
            maxDate.getTime() - (offset + daysSelected - 1) * 86400000
          ).setHours(0, 0, 0, 0)
        ),
        toDate = new Date(
          new Date(fromDate.getTime() + (daysSelected * 86400000 - 1000))
        );
      // console.log(
      //   "tempRows0.length",
      //   tempRows0.length,
      //   "daysSelected",
      //   daysSelected,
      //   "offset",
      //   offset,
      //   "maxDate",
      //   maxDate,
      //   "fromDate",
      //   fromDate,
      //   "toDate",
      //   toDate,
      //   "minDate",
      //   minDate
      // );
      const tempRows =
        offset === 0 || daysSelected > 6
          ? tempRows0.filter((r) => new Date(r.date) >= fromDate)
          : tempRows0.filter(
              (r) => new Date(r.date) >= fromDate && new Date(r.date) <= toDate
            );
      // console.log("tempRows", tempRows);

      // work out the min and max for each column and put into an object
      const tempMinMax = {};
      tempRows.forEach((row) => {
        // row.workspace_pct_used = row.workspace_pct_used || (0.01 * Math.random()).toFixed(4);
        const keys = Object.keys(row);
        keys.forEach((key) => {
          // console.log(acc, xx, ind, key, row[key]);
          if (key !== "id" && key !== "date" && key !== "high_usage") {
            row[key] = row[key] || (0.01 * Math.random()).toFixed(4);
            const values = tempRows.map((row) => Number(row[key]));
            tempMinMax[key] = {
              n: values.length,
              min: Math.min(...values),
              max: Math.max(...values),
              sum: values.reduce((acc, val) => acc + val, 0),
            };
            tempMinMax[key] = {
              ...tempMinMax[key],
              stdDev: Math.sqrt(
                values.reduce(
                  (acc, val) =>
                    acc + (val - tempMinMax[key].sum / values.length) ** 2,
                  0
                ) / values.length
              ),
            };
          }
        });
        // keys.forEach((key) => {
        //   // console.log(acc, xx, ind, key, row[key]);
        //   if (key !== "id" && key !== "date" && key !== "high_usage") {
        //     if (!tempMinMax[key])
        //       tempMinMax[key] = { min: 100, max: 0, n: 0, sum: 0 };
        //     if (Number(row[key]) < tempMinMax[key].min)
        //       tempMinMax[key].min = Number(row[key]);
        //     if (Number(row[key]) > tempMinMax[key].max)
        //       tempMinMax[key].max = Number(row[key]);
        //     tempMinMax[key].n = tempMinMax[key].n + 1;
        //     tempMinMax[key].sum = tempMinMax[key].sum + Number(row[key]);
        //   }
        // });
      });
      console.log("tempMinMax", tempMinMax);
      const n_finite_dates = tempRows.filter((r) =>
        isFinite(new Date(r.date))
      ).length;
      // console.log('Nb rows with Finite Dates', n_finite_dates);

      // work out average interval between dates
      const interval =
        n_finite_dates <= 11
          ? 120000
          : Math.abs(
              tempRows
                .filter((r) => isFinite(new Date(r.date)))
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 11)
                .map((r, i, ar) => {
                  const diff = Math.abs(
                    i >= 10
                      ? 0
                      : new Date(ar[i].date) - new Date(ar[i + 1].date)
                  );
                  return diff;
                })
                .reduce((a, b) => a + b) / 10
            );
      setReloadRemoteEvery(interval);
      console.log("INFO: Interval between reloads set to", interval, "ms");
      setRows(tempRows);
      setFilteredRows(tempRows);
      setMinMax(tempMinMax);
    }
    // eslint-disable-next-line
  }, [day1, day2, day3, day4, day5, day6, day7, loadDays, offset]);

  // Create a Set to track unique dates
  const uniqueDates = new Set();
  // Use filter to keep only the items with unique dates & last field populated
  let uniqueRows = [];
  if (rows && rows.length > 0) {
    uniqueRows = rows.filter((row) => {
      const isUnique = !uniqueDates.has(row.date);
      uniqueDates.add(row.date);
      return isUnique;
    });
  }

  // if (minMax) console.log("MinMax keys:", Object.keys(minMax));
  // if (uniqueRows) console.log("uniqueRows.length:", uniqueRows.length);

  return (
    <div className="App">
      {daysSelected < 7 ? (
        <>
          <Tooltip title="Previous Day">
            <IconButton
              color="info"
              sx={{
                fontSize: "inherit",
                position: "fixed",
                top: 2,
                right: 230,
                zIndex: 100,
              }}
              onClick={() => {
                setOffset(offset < 6 ? offset + 1 : 6);
              }}
              disabled={daysSelected > 6 || offset >= 6 ? true : false}
            >
              <ArrowLeftRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Day">
            <IconButton
              color="info"
              sx={{
                fontSize: "inherit",
                position: "fixed",
                top: 2,
                right: 190,
                zIndex: 100,
              }}
              onClick={() => {
                setOffset(offset > 1 ? offset - 1 : 0);
              }}
              disabled={offset < 1 ? true : false}
            >
              <ArrowRightRounded />
            </IconButton>
          </Tooltip>
        </>
      ) : null}
      <Tooltip title="Time Display">
        <FormControlLabel
          sx={{ position: "fixed", top: 2, right: 50, zIndex: 100 }}
          control={
            <Switch
              checked={useUTC}
              onChange={() => {
                setUseUTC(!useUTC);
              }}
              color="primary"
              inputProps={{ "aria-label": "toggle switch" }}
            />
          }
          label={useUTC ? "UTC" : "local time"}
        />
      </Tooltip>
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
      <Tooltip title="Choose another date range to display">
        <IconButton
          color="info"
          sx={{ position: "fixed", top: 2, right: 26, zIndex: 100 }}
          onClick={() => {
            setOpenDateSelector(true);
          }}
        >
          <CalendarMonth />
        </IconButton>
      </Tooltip>

      {/* <Box>LSAF Resource Usage</Box> */}
      {uniqueRows && uniqueRows.length > 0 && (
        <Graph
          rows={uniqueRows}
          filterRows={filterRows}
          useUTC={useUTC}
          info={
            daysSelected === 7
              ? ""
              : offset > 0
              ? `- viewing ${daysSelected} day(s), offset by ${offset} day(s)`
              : `- viewing ${daysSelected} day(s)`
          }
        />
      )}
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
          getRowId={(row) => Math.random()}
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
          pageSizeOptions={[10, 25, 50, 100, 1000]}
          pagination
        />
      )}
      {/* Dialog with date selector to use different data in graph */}
      <Dialog
        fullWidth
        maxWidth="xl"
        onClose={() => setOpenDateSelector(false)}
        open={openDateSelector}
        title={"Date Selector"}
      >
        <DialogTitle>Select date range to show</DialogTitle>
        <DialogContent>
          <Slider
            aria-label="Days"
            defaultValue={daysSelected}
            onChangeCommitted={(e, v) => {
              getWeek();
              setOpenDateSelector(false);
              setSelectedVersion(null);
              setDaysSelected(v);
              setOffset(0);
              setTimeout(() => {
                setReload(true);
              }, 2000); // wait a second and then trigger a reload
            }}
            // getAriaValueText={valueText}
            valueLabelDisplay="on"
            shiftStep={1}
            step={1}
            marks={marks}
            min={1}
            max={7}
            sx={{ width: "90%", m: 5 }}
          />
          <Tooltip
            title={
              "Loads the 7 daily CSV files which make up the latest week available - right up to within 5 minutes"
            }
          >
            <Button
              onClick={() => {
                getWeek();
                setOpenDateSelector(false);
                setSelectedVersion(null);
                setDaysSelected(7);
                setTimeout(() => {
                  setReload(true);
                }, 2000); // wait a second and then trigger a reload
              }}
              sx={{ backgroundColor: "lightgreen", mr: 2 }}
            >
              Latest
            </Button>
          </Tooltip>
          <Tooltip title={"Loads the past_week CSV data"}>
            <Button
              onClick={() => {
                setRows([]);
                setLoadDays(false);
                setOpenDateSelector(false);
                setSelectedVersion(null);
                setDaysSelected(7);
                setTimeout(() => {
                  addRows("*");
                  setReload(true);
                }, 2000); // wait a second and then trigger a reload
              }}
              sx={{ backgroundColor: "lightgreen", mr: 4 }}
            >
              Previous week
            </Button>
          </Tooltip>
          <Tooltip title={"Previous month"}>
            <Button
              onClick={() => {
                setRows([]);
                setLoadDays(false);
                setOpenDateSelector(false);
                setSelectedVersion(null);
                setDaysSelected(31);
                setTimeout(() => {
                  addRows("M");
                  setReload(true);
                }, 2000); // wait a second and then trigger a reload
              }}
              sx={{ color: "white", backgroundColor: "darkgreen", mr: 4 }}
            >
              Previous month
            </Button>
          </Tooltip>
          {versions &&
            versions.map((v, vi) => {
              const size = versions.length,
                backgroundColor =
                  "#" +
                  Math.floor(128 + (vi / size) * 128).toString(16) +
                  "ffff";
              return (
                <Tooltip title={`Version ${v} of previous week`}>
                  {" "}
                  <Button
                    onClick={() => {
                      setRows([]);
                      setLoadDays(false);
                      setOpenDateSelector(false);
                      setSelectedVersion(v);
                      setDaysSelected(7);
                      setTimeout(() => {
                        console.log(
                          "selectedVersion",
                          selectedVersion,
                          "loadDays",
                          loadDays,
                          "reload",
                          reload
                        );
                        addRows("*");
                        setReload(true);
                      }, 2000); // wait a second and then trigger a reload
                    }}
                    sx={{
                      backgroundColor: backgroundColor,
                      color: "black",
                      mr: 1,
                      mt: 3,
                      mb: 3,
                    }}
                  >
                    {v}
                  </Button>
                </Tooltip>
              );
            })}
        </DialogContent>
      </Dialog>
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
            <li>
              The switch at the top right allows you to choose between using
              dates/times in your local timezone or Coordinated Universal Time
              (UTC).
            </li>
            <li>
              The calendar icon at the top right can be clicked on, which will
              open a window to allow you to choose a date range to use in the
              graph.
            </li>
            <li>
              If you choose one day, then some arrows will appear at the top
              right of the graph to allow you to move back and forth one day at
              a time through the most recent week of data.
            </li>
            <li>
              The table colors bars based on where the value falls in the range
              of values. If <b>green</b> then the value is more than 2 standard
              deviations below the average. If <b>red</b> then the value is more
              than 2 standard deviations above the average. If <b>blue</b> then
              the value is within 2 standard deviations of the average.
            </li>
            <li>
              Take a look at this document that explains this screen some more:{" "}
              <a
                href={`https://argenxbvba.sharepoint.com/:w:/r/sites/Biostatistics/_layouts/15/doc.aspx?sourcedoc=%7B82324cc5-027b-48d6-ac67-ceebc19bd0f5%7D`}
                target="_blank"
                rel="noreferrer"
              >
                Resources Monitoring Web Application User Guide
              </a>
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
