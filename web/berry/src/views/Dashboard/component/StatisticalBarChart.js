import PropTypes from 'prop-types';

// material-ui
import { Grid, Typography,TableContainer,Table,TableBody,TableCell, TableHead, TableRow } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';

// project imports
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { Box } from '@mui/material';
import { timestamp2string } from 'utils/common';
import {  PhotoView,PhotoProvider } from 'react-photo-view';
import { ImageUrl } from 'utils/api';
// ==============================|| DASHBOARD DEFAULT - TOTAL GROWTH BAR CHART ||============================== //



const StatisticalBarChart = ({ isLoading, chartDatas }) => {
  chartData.options.xaxis.categories = chartDatas.xaxis;
  chartData.series = chartDatas.data;

  return (
    <>
      {isLoading ? (
        <SkeletonTotalGrowthBarChart />
      ) : (
        <MainCard>
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h3">最近10条识别</Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <TableContainer >
                <Table >
                  <TableHead>
                    <TableRow>
                      <TableCell>时间</TableCell>
                      <TableCell>卡片</TableCell>
                      <TableCell>标题</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {chartDatas.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{timestamp2string(row.created_at)}</TableCell>
                        <TableCell>
                          {row.oss_image && <PhotoProvider maskOpacity={0.2} >
                            <PhotoView key='1' src={ImageUrl+row.oss_image}>
                              <img alt={row.result} style={{width:'180px',height:'120px'}} src={ImageUrl+row.oss_image}/>
                            </PhotoView>
                          </PhotoProvider>}
                        </TableCell>
                        <TableCell>{row.result}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </MainCard>
      )}
    </>
  );
};

StatisticalBarChart.propTypes = {
  isLoading: PropTypes.bool
};

export default StatisticalBarChart;

const chartData = {
  height: 480,
  type: 'bar',
  options: {
    colors: [
      '#008FFB',
      '#00E396',
      '#FEB019',
      '#FF4560',
      '#775DD0',
      '#55efc4',
      '#81ecec',
      '#74b9ff',
      '#a29bfe',
      '#00b894',
      '#00cec9',
      '#0984e3',
      '#6c5ce7',
      '#ffeaa7',
      '#fab1a0',
      '#ff7675',
      '#fd79a8',
      '#fdcb6e',
      '#e17055',
      '#d63031',
      '#e84393'
    ],
    chart: {
      id: 'bar-chart',
      stacked: true,
      toolbar: {
        show: true
      },
      zoom: {
        enabled: true
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%'
      }
    },
    xaxis: {
      type: 'category',
      categories: []
    },
    legend: {
      show: true,
      fontSize: '14px',
      fontFamily: `'Roboto', sans-serif`,
      position: 'bottom',
      offsetX: 20,
      labels: {
        useSeriesColors: false
      },
      markers: {
        width: 16,
        height: 16,
        radius: 5
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
    fill: {
      type: 'solid'
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      show: true
    },
    tooltip: {
      theme: 'dark',
      fixed: {
        enabled: false
      },
      y: {
        formatter: function (val) {
          return '$' + val;
        }
      },
      marker: {
        show: false
      }
    }
  },
  series: []
};
