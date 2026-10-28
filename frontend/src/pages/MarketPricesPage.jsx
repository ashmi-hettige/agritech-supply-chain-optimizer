/**
 * Market prices: today's price of a crop at every economic centre, with a 30-day chart.
 * Open to every logged-in user.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import PriceChart from '../components/PriceChart';
import { formatDate, formatPrice, shortCentreName } from '../utils/format';
import './Insights.css';

// today's average compared with the 7-day average, e.g. "▲ 4.7%"
function trend(latest, average) {
  const change = ((Number(latest) - Number(average)) / Number(average)) * 100;
  if (change > 0.5) return { symbol: '▲', className: 'up', percent: `${change.toFixed(1)}%`, text: 'above' };
  if (change < -0.5) return { symbol: '▼', className: 'down', percent: `${Math.abs(change).toFixed(1)}%`, text: 'below' };
  return { symbol: '–', className: '', percent: '0%', text: 'the same as' };
}

export default function MarketPricesPage() {
  const [crops, setCrops] = useState([]);
  const [cropId, setCropId] = useState(null);
  const [centreId, setCentreId] = useState(null);
  const [data, setData] = useState({ cropId: null, latest: [], history: [], error: '' });

  useEffect(() => {
    api
      .get('/crops')
      .then(({ data: list }) => {
        setCrops(list);
        setCropId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((error) => setData((current) => ({ ...current, error: getErrorMessage(error) })));
  }, []);

  useEffect(() => {
    if (cropId === null) {
      return undefined;
    }
    let cancelled = false;
    Promise.all([
      api.get('/prices/latest', { params: { cropId } }),
      api.get('/prices/history', { params: { cropId, days: 30 } }),
    ])
      .then(([latest, history]) => {
        if (!cancelled) setData({ cropId, latest: latest.data, history: history.data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setData({ cropId, latest: [], history: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [cropId]);

  const loading = cropId !== null && data.cropId !== cropId;
  const crop = crops.find((item) => item.id === cropId);
  // the chart follows the chosen centre, or the best-paying centre by default
  const chartCentreId = centreId ?? data.latest[0]?.centreId;
  const series = data.history.find((item) => item.centreId === chartCentreId);

  return (
    <section aria-labelledby="prices-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Market prices</p>
          <h1 id="prices-title">Today at the economic centres</h1>
        </div>
      </div>

      <div className="tab-row crop-tabs" role="group" aria-label="Crop">
        {crops.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-chip ${item.id === cropId ? 'on' : ''}`}
            aria-pressed={item.id === cropId}
            onClick={() => { setCropId(item.id); setCentreId(null); }}
          >
            {item.name}
          </button>
        ))}
      </div>

      {data.error && <div className="alert alert-error" role="alert">{data.error}</div>}
      {loading && <p className="text-muted">Loading prices…</p>}

      {!loading && crop && data.latest.length > 0 && (
        <div className="insight-grid">
          <section className="panel" aria-labelledby="latest-prices-title">
            <div className="panel-head">
              <h2 id="latest-prices-title">{crop.name}, LKR per kg</h2>
              <span className="text-muted">{formatDate(data.latest[0].latestDate)}</span>
            </div>
            <div className="table-scroll">
              <table className="data-table price-table">
                <thead>
                  <tr>
                    <th scope="col">Centre</th>
                    <th scope="col">Low</th>
                    <th scope="col">Average</th>
                    <th scope="col">High</th>
                    <th scope="col"><abbr title="Compared with the 7-day average">7-day</abbr></th>
                  </tr>
                </thead>
                <tbody>
                  {data.latest.map((row, index) => {
                    const change = trend(row.latestAvgPrice, row.sevenDayAvgPrice);
                    return (
                      <tr
                        key={row.centreId}
                        className={row.centreId === chartCentreId ? 'selected' : ''}
                        onClick={() => setCentreId(row.centreId)}
                      >
                        <td>
                          <button type="button" className="row-button" onClick={() => setCentreId(row.centreId)}>
                            <strong>{shortCentreName(row.centreName)}</strong>
                            <span>{row.district}</span>
                          </button>
                          {index === 0 && <span className="badge badge-fresh">Best today</span>}
                        </td>
                        <td>{formatPrice(row.minPrice)}</td>
                        <td><strong>{formatPrice(row.latestAvgPrice)}</strong></td>
                        <td>{formatPrice(row.maxPrice)}</td>
                        <td>
                          <span className={`trend ${change.className}`} title={`${change.percent} ${change.text} the 7-day average`}>
                            {change.symbol} {change.percent}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="field-hint">Click a centre to see its last 30 days.</p>
          </section>

          <section className="panel" aria-labelledby="chart-title">
            <div className="panel-head">
              <h2 id="chart-title">Last 30 days · {series ? shortCentreName(series.centreName) : ''}</h2>
            </div>
            {series && <PriceChart days={series.days} label={`${crop.name} at ${series.centreName}`} />}
          </section>
        </div>
      )}
    </section>
  );
}
