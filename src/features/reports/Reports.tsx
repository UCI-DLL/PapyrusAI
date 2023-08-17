import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import React from "react";
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

export default function Reports(): JSX.Element {


  function createData(
    name: string,
    classId: string,
    assignment: number,
    studentId: number,
    completed: boolean,
  ) {
    return { name, classId, assignment, studentId, completed };
  }
  
  const rows = [
    createData('Frozen yoghurt', "ENG 123", 6.0, 24, true),
    createData('Ice cream sandwich', "ENG 123", 9.0, 37, false),
    createData('Eclair', "ENG 123", 16.0, 24, false),
    createData('Cupcake', "ENG 123", 3, 67, true),
    createData('Gingerbread', "ENG 123", 16.0, 49, true),
  ];

  return (
    <div style={{
      maxWidth: "1024px",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      flexDirection: "column",
      margin: "0 auto",
      padding: "0.4rem"
    }}>
      <h3>Reports</h3>
      <hr />

      <div style={{ width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-around"}}>
        
        <Button variant="contained">
          Course ▼
        </Button>
        <Button variant="contained">
          Assignment ▼
        </Button>

        <Button variant="contained">
          Advanced Filters ▼
        </Button>
      </div>

      <hr />

      <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Student Name</TableCell>
            <TableCell align="right">Class</TableCell>
            <TableCell align="right">Assignment</TableCell>
            <TableCell align="right">Student ID</TableCell>
            <TableCell align="right">Completed?</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.classId}</TableCell>
              <TableCell align="right">{row.assignment}</TableCell>
              <TableCell align="right">{row.studentId}</TableCell>
              <TableCell align="right">{row.completed ? <DoneIcon color="primary" /> : <CloseIcon color="error"/>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
      
    </div>
  )
}