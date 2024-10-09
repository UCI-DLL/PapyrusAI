import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import LinearProgress from '@mui/material/LinearProgress';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';


interface Column {
  id: 'name' | 'claim' | 'counter' | 'evidence' | 'position';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: number) => string;
}

const columns: readonly Column[] = [
  { id: 'name', label: 'Name', minWidth: 170 },
  { id: 'claim', label: 'Claim', minWidth: 100 },
  {
    id: 'counter',
    label: 'Counterclaim',
    minWidth: 100,
  },
  {
    id: 'evidence',
    label: 'Evidence',
    minWidth: 100,
  },
  {
    id: 'position',
    label: 'Position',
    minWidth: 100,
  },
];

interface Data {
  name: string;
  claim: boolean;
  counter: boolean;
  evidence: boolean;
  position: boolean;
}

function createData(
  name: string,
  claim: boolean,
  counter: boolean,
  evidence: boolean,
  position: boolean,
): Data {
  return { name, claim, counter, evidence, position };
}

const rows = [
  createData('Liam', false, true, false, true),
  createData('Olivia', true, false, true, false),
  createData('Noah', false, false, true, true),
  createData('Emma', false, false, true, false),
  createData('Oliver', true, true, true, false),
  createData('Charlotte', true, false, true, true),
  createData('James', false, true, false, true),
  createData('Amelia', true, false, false, true),
  createData('Elijah', false, true, true, false),
  createData('Sophia', false, false, true, false),
  createData('Mateo', true, false, true, false),
  createData('Mia', false, false, false, true),
  createData('Theodore', true, true, true, true),
  createData('Isabella', true, false, true, false),
  createData('William', false, true, false, false),
];


export default function ModuleReports(): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };


  return !isLoading ? (
    <div className="reports">
      <h3>LANG 101 Spring 2024</h3>
      <hr />
      <h4>Module Stats </h4>
      &nbsp;
      <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-evenly" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", width: "20%" }}>
          <CircularProgressbar
            value={66}
            text={`${66}%`}
            styles={buildStyles({
              // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
              strokeLinecap: 'butt',
              // Colors
              pathColor: '#ffd200',//`rgba(62, 152, 199, ${66 / 100})`,
              textColor: '#000',
              trailColor: '#d6d6d6', //white
              backgroundColor: '#000',
            })}
          />
          &nbsp;
          <h5 style={{ textAlign: "center" }}>Claims</h5>
        </div>


        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", width: "20%" }}>
          <CircularProgressbar
            value={45}
            text={`${45}%`}
            styles={buildStyles({
              // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
              strokeLinecap: 'butt',
              // Colors
              pathColor: '#0064a4',//`rgba(62, 152, 199, ${66 / 100})`,
              textColor: '#000',
              trailColor: '#d6d6d6', //white
              backgroundColor: '#000',
            })}
          />
          &nbsp;
          <h5 style={{ textAlign: "center" }}>Counterclaim</h5>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", width: "20%" }}>
          <CircularProgressbar
            value={78}
            text={`${78}%`}
            styles={buildStyles({
              // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
              strokeLinecap: 'butt',
              // Colors
              pathColor: '#6aa2b8',//`rgba(62, 152, 199, ${66 / 100})`,
              textColor: '#000',
              trailColor: '#d6d6d6', //white
              backgroundColor: '#000',
            })}
          />
          &nbsp;
          <h5 style={{ textAlign: "center" }}>Evidence</h5>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", width: "20%" }}>
          <CircularProgressbar
            value={22}
            text={`${22}%`}
            styles={buildStyles({
              // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
              strokeLinecap: 'butt',
              // Colors
              pathColor: '#f78d2d',//`rgba(62, 152, 199, ${66 / 100})`,
              textColor: '#000',
              trailColor: '#d6d6d6', //white
              backgroundColor: '#000',
            })}
          />
          &nbsp;
          <h5 style={{ textAlign: "center" }}>Position</h5>
        </div>

      </div>

      <hr />

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }} >
          <Table stickyHeader aria-label="sticky table" >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth, backgroundColor: "white" }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={row.name}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {typeof value === 'boolean'
                              ? value ? <CheckCircleOutlineIcon color="success" /> : <HighlightOffIcon color="error" />
                              : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

    </div>
  ) : (
    <LinearProgress />
  )
}