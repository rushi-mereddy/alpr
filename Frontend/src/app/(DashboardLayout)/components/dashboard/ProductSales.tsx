
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Avatar, Fab } from '@mui/material';
import { IconArrowDownRight, IconTrendingUp2 } from '@tabler/icons-react';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const ProductSales = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  // chart
  const optionscolumnchart: any = {
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 60,
      sparkline: {
        enabled: true,
      },
      group: 'sparklines',
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      colors: [primary],
      type: 'solid',
      opacity: 0.05,
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
    },
  };
  const seriescolumnchart: any = [
    {
      name: '',
      color: primary,
      data: [25, 66, 20, 40, 12, 58, 20, 66, 20, 40, 12, 58, 20],
    },
  ];

  return (
    <DashboardCard
      title="Daily Trend"
      action={
        <Fab color="error" size="medium" sx={{color: '#ffffff'}}>
          <IconTrendingUp2 width={48} />
        </Fab>
      }
      footer={
        <Chart options={optionscolumnchart} series={seriescolumnchart} type="area" width={"100%"} height="100px" />
      }
    >
      <>
        {/* <Typography variant="h3" fontWeight="700" mt="-20px">
          $6,820
        </Typography> */}
      </>
    </DashboardCard>
  );
};

export default ProductSales;
