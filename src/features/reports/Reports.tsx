import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper 
} from "@mui/material";
import React from "react";

export default function Reports(): JSX.Element {


  function createData(
    name: string,
    classId: string,
    module: number,
    studentId: number,
    completed: number,
  ) {
    return { name, classId, module, studentId, completed };
  }
  
  const rows = [
    createData('Student Name 1', "ENG 123", 6.0, 24, 234),
    createData('Student Name 2', "ENG 123", 9.0, 37, 345),
    createData('Student Name 3', "ENG 123", 16.0, 24, 346),
    createData('Student Name 4', "ENG 123", 3, 67, 123),
    createData('Student Name 5', "ENG 123", 16.0, 49, 234),
  ];

  return (
    <div className="reports">
      <h3>Reports</h3>
      <hr />

      <div className="reports__filters">
        
        <div>
          Sort By ▼
        </div>
        <div>
          Course ▼
        </div>

        <div>
          Advanced Filters ▼
        </div>
      </div>

      <hr />

      <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Student Name</TableCell>
            <TableCell align="right">Class</TableCell>
            <TableCell align="right">module</TableCell>
            <TableCell align="right">Total Duration</TableCell>
            <TableCell align="right">Last Accessed</TableCell>
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
              <TableCell align="right">{row.module}</TableCell>
              <TableCell align="right">{row.studentId}</TableCell>
              <TableCell align="right">{row.completed }</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
      
    </div>
  )
}