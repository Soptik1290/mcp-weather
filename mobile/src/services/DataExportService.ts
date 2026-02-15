import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { WeatherData } from '../types';

class DataExportServiceClass {
    async exportToJSON(data: WeatherData | null): Promise<void> {
        if (!data) return;

        const date = new Date().toISOString().split('T')[0];
        const filename = `weather_export_${data.location.name}_${date}.json`;
        const path = `${RNFS.CachesDirectoryPath}/${filename}`;

        try {
            await RNFS.writeFile(path, JSON.stringify(data, null, 2), 'utf8');

            await Share.open({
                title: 'Export Weather Data (JSON)',
                url: `file://${path}`,
                type: 'application/json',
                filename: filename
            });
        } catch (err) {
            console.error('Export JSON failed', err);
            throw err;
        }
    }

    async exportToCSV(data: WeatherData | null): Promise<void> {
        if (!data) return;

        const date = new Date().toISOString().split('T')[0];
        const filename = `weather_forecast_${data.location.name}_${date}.csv`;
        const path = `${RNFS.CachesDirectoryPath}/${filename}`;

        // Build CSV Content
        let csv = 'Date,Min Temp (C),Max Temp (C),Weather,Precip (mm),Wind (km/h),Sunrise,Sunset\n';

        if (data.daily_forecast) {
            data.daily_forecast.forEach(day => {
                const dateStr = day.date;
                const min = Math.round(day.temperature_min);
                const max = Math.round(day.temperature_max);
                const desc = day.weather_description || '';
                const precip = day.precipitation_sum || 0;
                const wind = day.wind_speed_max || 0;
                const sunrise = day.sunrise ? new Date(day.sunrise).toLocaleTimeString() : '';
                const sunset = day.sunset ? new Date(day.sunset).toLocaleTimeString() : '';

                csv += `${dateStr},${min},${max},"${desc}",${precip},${wind},${sunrise},${sunset}\n`;
            });
        }

        // Append Hourly if needed, or keep separate. Let's just do Daily for readability.
        // Or adding a section for Current
        if (data.current) {
            csv += `\nCurrent Conditions\n`;
            csv += `Temperature,${data.current.temperature}\n`;
            csv += `Feels Like,${data.current.feels_like}\n`;
            csv += `Description,${data.current.weather_description}\n`;
        }

        try {
            await RNFS.writeFile(path, csv, 'utf8');

            await Share.open({
                title: 'Export Weather Forecast (CSV)',
                url: `file://${path}`,
                type: 'text/csv',
                filename: filename
            });
        } catch (err) {
            console.error('Export CSV failed', err);
            throw err;
        }
    }
}

export const dataExportService = new DataExportServiceClass();
