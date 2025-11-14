'use client'
import { Grid, Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
// components
import ProfitExpenses from '@/app/(DashboardLayout)/components/dashboard/ProfitExpenses';
import TrafficDistribution from '@/app/(DashboardLayout)/components/dashboard/TrafficDistribution';
import VehiclesData from './components/dashboard/VehiclesData';
import ProductSales from '@/app/(DashboardLayout)/components/dashboard/ProductSales';

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="ALPR Dashboard">
      <Box>
        <Grid container spacing={3}>
          {/* <Grid item xs={12} lg={8}>
            <ProfitExpenses />
          </Grid> */}
          <Grid item xs={6} lg={6} sm={12}>
            <TrafficDistribution />
          </Grid>
          <Grid item xs={6} lg={6} sm={12}>
            <ProductSales />
          </Grid>
          <Grid item xs={12} lg={12} sm={12}>
            <VehiclesData />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  )
}

export default Dashboard;
