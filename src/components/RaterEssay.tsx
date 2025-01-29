
import {
  Typography,
} from "@mui/material";
import { BarSeriesType, ChartsLegend, ResponsiveChartContainer } from "@mui/x-charts";
import { useEffect } from "react";

interface RaterEssayProps {
  message: string;
  raterArray: Array<Array<string>>;
  essay: string;
}

export default function RaterEssay(props: RaterEssayProps): JSX.Element {
  // const [itemData, setItemData] = useState<any>();
  const barSeries: BarSeriesType[] = [
    {
      type: 'bar',
      id: 'lead',
      label: 'Lead',
      data: [],
      color: "#ffd200"
    },
    {
      type: 'bar',
      id: 'position',
      label: 'Position',
      data: [],
      color: "#0064a4",
    },
    {
      type: 'bar',
      id: 'claim',
      label: 'Claim',
      data: [],
      color: "#6aa2b8",
    },
    {
      type: 'bar',
      id: 'counterclaim',
      label: 'Counterclaim',
      data: [],
      color: "#f78d2d",
    },
    {
      type: 'bar',
      id: 'rebuttal',
      label: 'Rebuttal',
      data: [],
      color: "#934D6D",
    },
    {
      type: 'bar',
      id: 'evidence',
      label: 'Evidence',
      data: [],
      color: "#8D91C7",
    },
    {
      type: 'bar',
      id: 'conclude',
      label: 'Concluding Summary',
      data: [],
      color: "#7ab800",
    },
  ];

  useEffect(() => {
    //https://stackoverflow.com/questions/58532751/highlighting-a-string-based-on-given-indices
    console.log("rater", props);

    function removeOverlapsArray(dataArray: any, byDiscourse = false) {
      // Convert array of arrays into objects for easier manipulation
      const headers = dataArray[0];
      const data = dataArray
        .slice(1)
        .filter((row: any) => row.length > 0) // Remove empty rows
        .map((row: any) =>
          Object.fromEntries(
            headers.map((header: any, index: number) => [header, row[index]])
          )
        );

      // Parse relevant fields as integers or floats
      const parsedData = data.map((item: any) => ({
        ...item,
        start: parseInt(item.start, 10),
        end: parseInt(item.end, 10),
        score_discourse_type: parseFloat(item.score_discourse_type),
      }));

      // Sort data by start index and, in case of ties, by end index
      parsedData.sort((a: any, b: any) => {
        if (a.start === b.start) return a.end - b.end;
        return a.start - b.start;
      });

      const processed = [];
      const trimmed = [];

      // Group by discourse type if byDiscourse is true
      const groups = byDiscourse
        ? parsedData.reduce((acc: any, item: any) => {
          acc[item.discourse_type] = acc[item.discourse_type] || [];
          acc[item.discourse_type].push(item);
          return acc;
        }, {})
        : { all: parsedData };

      // Process each group independently
      for (const groupKey in groups) {
        const group = groups[groupKey];
        let prevSegment = null;

        for (const segment of group) {
          if (!prevSegment || segment.start > prevSegment.end) {
            // No overlap, include the segment as is
            processed.push(segment);
            prevSegment = segment;
          } else {
            // Overlap detected
            if (segment.score_discourse_type > prevSegment.score_discourse_type) {
              // Adjust the end of the previous segment
              trimmed.push({ ...prevSegment, end: segment.start - 1 });
              prevSegment.end = segment.start - 1; // Modify the previous segment in place
              processed.pop();
              processed.push(prevSegment);

              // Keep the current segment fully
              processed.push(segment);
              prevSegment = segment;
            } else {
              // Adjust the start of the current segment
              if (segment.start <= prevSegment.end) {
                trimmed.push({ ...segment, start: prevSegment.end + 1 });
                segment.start = prevSegment.end + 1; // Modify the current segment in place
              }

              // Include the trimmed segment only if it still has a valid range
              if (segment.start <= segment.end) {
                processed.push(segment);
                prevSegment = segment;
              }
            }
          }
        }
      }

      // Convert processed and trimmed data back to array-of-arrays format
      const convertToArray = (segments: any) => [
        headers,
        ...segments.map((item: any) =>
          headers.map((header: any) => item[header] || item[header.toLowerCase()]?.toString() || "")
        ),
      ];

      return {
        processed: convertToArray(processed),
        trimmed: convertToArray(trimmed),
      };
    }

    const resultt = removeOverlapsArray(props.raterArray, false);

    console.log("Processed Segments:", resultt.processed);
    console.log("Trimmed Segments:", resultt.trimmed);

    let result = resultt.processed.reduce((str, [id, start, end, discourse, type]) => {
      const color = barSeries[Number(type)] && barSeries[Number(type)].color ? barSeries[Number(type)].color : "#000";
      if (Number(start) > -1 && Number(end) > -1 && str[Number(start)] && str[Number(end)]) {
        str[Number(start)] = `<mark style="background-color:${color}">${str[Number(start)]}`;
        str[Number(end)] = `${str[Number(end)]}</mark>`;
        return str;
      }
      else {
        return str;
      }
      //TODO need to split by punctuation to get the right amount
      //Problem is that then you have a hard time joining the str back together cause you dont know how it got split
    }, props.essay.replace(/\n/g, " ").split(" ")).join(" "); //replace new lines with spaces and then split on spaces
    if (document.getElementById("raterEssay") && document.getElementById("raterEssay") !== null) {
      document.getElementById("raterEssay")!.innerHTML = result;
    }
    // eslint-disable-next-line
  }, [props]);

  return (
    <div className="chat__wizard">
      <div>
        {props.message}
      </div>
      <hr />
      <div className="chat__wizard__modal">
        {/* //TODO figure out this part on mobile  */}
        <Typography>Feedback Legend</Typography>
        <ResponsiveChartContainer series={barSeries} height={100} disableAxisListener>
          <ChartsLegend
            direction="row"
            position={{
              horizontal: 'left',
              vertical: 'top',
            }}
          // onItemClick={(event, context, index) => setItemData([context, index])}
          />
        </ResponsiveChartContainer>

        <hr />

        <Typography>
          <div id="raterEssay"></div>
        </Typography>

      </div>
    </div>
  )
}