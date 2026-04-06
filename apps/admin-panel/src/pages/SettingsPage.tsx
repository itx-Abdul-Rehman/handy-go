import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { settingsApi } from '../services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const GENERAL_DEFAULTS = {
  platformName: 'Handy Go',
  supportEmail: 'support@handygo.pk',
  supportPhone: '+92 21 1234567',
  defaultLanguage: 'en',
  maintenanceMode: false,
};

const NOTIFICATION_DEFAULTS = {
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  sosAlertEmail: true,
  sosAlertSms: true,
  bookingUpdates: true,
  marketingEmails: false,
};

const PLATFORM_DEFAULTS = {
  platformFeePercent: 15,
  minBookingAmount: 500,
  maxServiceRadius: 25,
  cancellationFeePercent: 10,
  workerVerificationRequired: true,
  autoAssignWorkers: false,
};

const SECURITY_DEFAULTS = {
  twoFactorAuth: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordExpiry: 90,
};

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState(GENERAL_DEFAULTS);

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState(NOTIFICATION_DEFAULTS);

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState(PLATFORM_DEFAULTS);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState(SECURITY_DEFAULTS);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await settingsApi.getSettings();
        if (saved.general && Object.keys(saved.general).length > 0)
          setGeneralSettings({ ...GENERAL_DEFAULTS, ...(saved.general as typeof GENERAL_DEFAULTS) });
        if (saved.notifications && Object.keys(saved.notifications).length > 0)
          setNotificationSettings({ ...NOTIFICATION_DEFAULTS, ...(saved.notifications as typeof NOTIFICATION_DEFAULTS) });
        if (saved.platform && Object.keys(saved.platform).length > 0)
          setPlatformSettings({ ...PLATFORM_DEFAULTS, ...(saved.platform as typeof PLATFORM_DEFAULTS) });
        if (saved.security && Object.keys(saved.security).length > 0)
          setSecuritySettings({ ...SECURITY_DEFAULTS, ...(saved.security as typeof SECURITY_DEFAULTS) });
      } catch {
        // Use defaults — no saved settings yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(async (section: string) => {
    setSaving(true);
    try {
      const sectionKey = section.toLowerCase() as 'general' | 'notifications' | 'platform' | 'security';
      const dataMap: Record<string, Record<string, unknown>> = {
        general: generalSettings,
        notifications: notificationSettings,
        platform: platformSettings,
        security: securitySettings,
      };
      await settingsApi.saveSettings(sectionKey, dataMap[sectionKey]);
      setSnackbar({ open: true, message: `${section} settings saved successfully!` });
    } catch {
      setSnackbar({ open: true, message: `Failed to save ${section} settings` });
    } finally {
      setSaving(false);
    }
  }, [generalSettings, notificationSettings, platformSettings, securitySettings]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure platform settings and preferences
        </Typography>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<SettingsIcon />} label="General" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<PaymentIcon />} label="Platform" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Platform Name"
                  value={generalSettings.platformName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, platformName: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    value={generalSettings.defaultLanguage}
                    label="Default Language"
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, defaultLanguage: e.target.value })
                    }
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ur">Urdu</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Support Email"
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Support Phone"
                  value={generalSettings.supportPhone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.maintenanceMode}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })
                      }
                      color="warning"
                    />
                  }
                  label="Maintenance Mode"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  When enabled, only admins can access the platform
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={() => handleSave('General')}
                  disabled={saving}
                >
                  Save General Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Communication Channels
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label="SMS Notifications"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Push Notifications"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  SOS Alerts
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.sosAlertEmail}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          sosAlertEmail: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Email SOS Alerts to Admins"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.sosAlertSms}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          sosAlertSms: e.target.checked,
                        })
                      }
                    />
                  }
                  label="SMS SOS Alerts to Admins"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Other Notifications
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.bookingUpdates}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          bookingUpdates: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Booking Update Notifications"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          marketingEmails: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Marketing Emails"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={() => handleSave('Notifications')}
                  disabled={saving}
                >
                  Save Notification Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Platform Settings */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Platform Fee: {platformSettings.platformFeePercent}%
                </Typography>
                <Slider
                  value={platformSettings.platformFeePercent}
                  onChange={(_e, value) =>
                    setPlatformSettings({ ...platformSettings, platformFeePercent: value as number })
                  }
                  min={5}
                  max={30}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cancellation Fee: {platformSettings.cancellationFeePercent}%
                </Typography>
                <Slider
                  value={platformSettings.cancellationFeePercent}
                  onChange={(_e, value) =>
                    setPlatformSettings({ ...platformSettings, cancellationFeePercent: value as number })
                  }
                  min={0}
                  max={25}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Minimum Booking Amount (Rs.)"
                  type="number"
                  value={platformSettings.minBookingAmount}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      minBookingAmount: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Max Service Radius (km)"
                  type="number"
                  value={platformSettings.maxServiceRadius}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      maxServiceRadius: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={platformSettings.workerVerificationRequired}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          workerVerificationRequired: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Require Worker Verification"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Workers must be verified before accepting bookings
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={platformSettings.autoAssignWorkers}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          autoAssignWorkers: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Auto-Assign Workers"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Automatically assign the best matching worker
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={() => handleSave('Platform')}
                  disabled={saving}
                >
                  Save Platform Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Security settings affect all admin accounts. Changes take effect immediately.
            </Alert>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorAuth: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Require Two-Factor Authentication"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      maxLoginAttempts: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Password Expiry (days)"
                  type="number"
                  value={securitySettings.passwordExpiry}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordExpiry: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={() => handleSave('Security')}
                  disabled={saving}
                >
                  Save Security Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
