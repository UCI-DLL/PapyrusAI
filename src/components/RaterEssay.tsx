
import {
  Typography,
} from "@mui/material";
import { BarSeriesType, ChartsLegend, ResponsiveChartContainer } from "@mui/x-charts";
import { useState } from "react";



export default function RaterEssay(): JSX.Element {
  const [itemData, setItemData] = useState<any>();
  const barSeries: BarSeriesType[] = [
    {
      type: 'bar',
      id: 'claims',
      label: 'Claims',
      data: [0, 1, 2],
      color: "#ffd200"
    },
    {
      type: 'bar',
      id: 'counter',
      label: 'Counterclaim',
      data: [0, 1, 2],
      color: "#0064a4",
    },
    {
      type: 'bar',
      id: 'evidence',
      label: 'Evidence',
      data: [0, 1, 2],
      color: "#6aa2b8",
    },
    {
      type: 'bar',
      id: 'position',
      label: 'Position',
      data: [0, 1, 2],
      color: "#f78d2d",
    },
  ];


  return (
    <div className="chat__wizard">
      <div className="chat__wizard__modal">
        <Typography>Feedback Legend</Typography>
        <ResponsiveChartContainer series={barSeries} width={600} height={60}>
          <ChartsLegend
            direction="row"
            position={{
              horizontal: 'left',
              vertical: 'top',
            }}
            onItemClick={(event, context, index) => setItemData([context, index])}
          />
        </ResponsiveChartContainer>

        <Typography>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. <mark style={{ backgroundColor: "#0064a4" }}>Proin vulputate id tellus eget tincidunt.</mark> Integer egestas hendrerit nunc ut vestibulum. Aliquam pharetra ante vitae lorem accumsan, quis porttitor enim auctor. Ut eu libero enim. Integer iaculis, ligula eget convallis elementum, mauris urna lobortis enim, rutrum porttitor orci orci in justo. Proin at gravida mi. Etiam urna ipsum, eleifend et nibh a, tristique varius elit. Curabitur facilisis sed erat ut volutpat. Suspendisse pellentesque efficitur consequat. Aliquam ac rhoncus libero. Aenean lorem nibh, sodales ut pharetra bibendum, convallis a mi. Vivamus a eros sit amet mauris mattis fringilla. Etiam volutpat ante ut feugiat varius. Curabitur porttitor luctus sem sed mattis. Duis pharetra, ex id suscipit consectetur, dolor leo lobortis nisi, nec varius felis ex lobortis sem.
        </Typography>
        <Typography>
          Donec arcu dolor, dignissim quis tempus sed, imperdiet eget diam. Vestibulum arcu nulla, mattis ut dignissim quis, consequat sed ex. Quisque aliquet nisi ut dignissim ornare. Mauris sed aliquet orci. <mark style={{ backgroundColor: "#6aa2b8" }}>In non arcu in magna maximus auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus. </mark>In ornare a arcu quis dictum. Suspendisse vitae dolor ut sem porttitor fermentum in eu enim.
        </Typography>
        <Typography>
          Morbi commodo eget tortor quis luctus. Curabitur vitae lorem at tortor ullamcorper luctus sit amet at lorem. Etiam hendrerit felis eu neque semper, eu venenatis libero luctus. Vivamus tellus nulla, ultricies non augue in, suscipit laoreet felis. Cras quis elementum risus, quis feugiat ipsum. Cras imperdiet, ante sed consequat porta, lorem mauris imperdiet risus, id vestibulum orci leo eu metus. Morbi consectetur aliquam mauris et mollis. Vivamus ornare fringilla leo non porta. Vestibulum interdum fringilla placerat. Integer a imperdiet nisi. Sed viverra neque vel arcu aliquam ornare sed in tortor. Phasellus vitae ornare ligula. Quisque viverra rutrum risus, sit amet vehicula enim efficitur sed. Quisque tristique commodo urna, vel elementum tellus congue consequat.

        </Typography>
        <Typography>
          Vestibulum malesuada mi leo, nec tristique magna convallis vel. Nunc quis lorem sed tellus euismod facilisis. Ut rhoncus, arcu a vestibulum laoreet, metus enim placerat arcu, eu mollis lectus massa at dui. Vestibulum molestie nulla eget laoreet mollis. Nullam molestie justo a rhoncus faucibus. <mark style={{ backgroundColor: "#f78d2d" }}>Morbi eget lectus ornare, consequat dolor id, condimentum diam.</mark> Sed feugiat maximus lorem, a dictum eros auctor vitae. Proin faucibus semper molestie.

        </Typography>
        <Typography>
          Aenean nec pharetra lectus, sit amet imperdiet nunc. Integer fringilla libero vel nunc ullamcorper, sit amet bibendum erat faucibus. Suspendisse bibendum sollicitudin arcu ut commodo. Ut in massa massa. Ut nulla purus, pellentesque ac turpis vitae, faucibus vestibulum nunc. Aliquam luctus cursus rhoncus. Fusce lobortis ipsum augue, non posuere risus rutrum et. Integer pretium, leo in molestie finibus, ligula lectus finibus nulla, et suscipit felis turpis ut nisl. Aliquam fringilla nunc ac tempor commodo. Proin vulputate eu velit a dignissim. Donec placerat vulputate pellentesque.

        </Typography>
      </div>
    </div>
  )
}