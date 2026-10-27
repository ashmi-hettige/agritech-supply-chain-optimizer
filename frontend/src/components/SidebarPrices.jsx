/**
 * Small "Today at Dambulla" price box for the farmer's sidebar.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api from '../api/client';

const CROPS = ['Carrot', 'Leeks', 'Beans'];

function trendSymbol(latest, average) {
  const change = (Number(latest) - Number(average)) / Number(average);
  if (change > 0.005) return { symbol: '▲', className: 'up', text: 'up' };
  if (change < -0.005) return { symbol: '▼', className: 'down', text: 'down' };
  return { symbol: '–', className: '', text: 'no change' };
}

export default function SidebarPrices() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/crops')
      .then(({ data: crops }) => Promise.all(
        crops
          .filter((crop) => CROPS.includes(crop.name))
          .map((crop) => api.get('/prices/latest', { params: { cropId: crop.id } }).then(({ data }) => {
            const centre = data.find((c) => c.centreName.startsWith('Dambulla')) ?? data[0];
            return centre ? { name: crop.name, price: centre } : null;
          })),
      ))
      .then((result) => {
        if (!cancelled) setRows(result.filter(Boolean));
      })
      .catch(() => {
        // prices are a nice extra; the sidebar works without them
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="sidebar-prices">
      <span className="sidebar-prices-title">Today at Dambulla</span>
      {rows.map(({ name, price }) => {
        const trend = trendSymbol(price.latestAvgPrice, price.sevenDayAvgPrice);
        return (
          <div key={name} className="sidebar-price-row">
            <span>{name}</span>
            <span>
              LKR {Math.round(Number(price.latestAvgPrice))}{' '}
              <span className={`trend-mark ${trend.className}`} aria-label={trend.text}>{trend.symbol}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}