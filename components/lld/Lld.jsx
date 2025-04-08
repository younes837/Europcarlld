"use client"
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const Lld = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("mois");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/ca_annuelle');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();

                if (Array.isArray(result)) {
                    processData(result, filter);
                } else {
                    console.error('Data format unexpected or missing');
                    setChartData({ labels: [], datasets: [] });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setChartData({ labels: [], datasets: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    const processData = (data, filter) => {
        let filteredData;

        if (filter === 'mois') {
            filteredData = data;
        } else if (filter === 'trimestre') {
            filteredData = groupByQuarter(data);
        } else if (filter === 'annee') {
            filteredData = groupByYear(data);
        }

        const labels = filteredData.map(item => filter === 'mois' ? `${item.annee}-${String(item.mois).padStart(2, '0')}` : item.label);
        const values = filteredData.map(item => filter === 'mois' ? item.CA : item.value);

        setChartData({
            labels,
            datasets: [
                {
                    label: 'CAD',
                    data: values,
                    backgroundColor: 'rgb(21, 128, 61)',
                },
            ],
        });
    };

    const groupByQuarter = (data) => {
        const grouped = {};
        data.forEach(({ annee, mois, CA }) => {
            const quarter = Math.ceil(mois / 3);
            const key = `${annee} T${quarter}`;
            if (!grouped[key]) {
                grouped[key] = { label: key, value: 0 };
            }
            grouped[key].value += CA;
        });
        return Object.values(grouped);
    };

    const groupByYear = (data) => {
        const grouped = {};
        data.forEach(({ annee, CA }) => {
            if (!grouped[annee]) {
                grouped[annee] = { label: `${annee}`, value: 0 };
            }
            grouped[annee].value += CA;
        });
        return Object.values(grouped);
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
    };

    if (loading) return <p className="text-center text-lg font-medium mt-10">Loading chart...</p>;
    if (!chartData) return <p className="text-center text-lg font-medium mt-10">No chart data available</p>;

    return (
        <div className="w-full flex flex-col items-center">
            <h1 className="text-2xl font-bold text-center mt-10 mb-8">
                Chiffre D'affaires (lld) Par {filter}
                {console.log(chartData)}
            </h1>

            <div className="w-[98%] h-[500px] mt-2">
                <div className="mb-4">
                    <select
                        id="ca_select"
                        onChange={handleFilterChange}
                        value={filter}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-green-300"
                    >
                        <option value="mois">Mois</option>
                        <option value="trimestre">Trimestre</option>
                        <option value="annee">Année</option>
                    </select>

                    {/* <Select value={filter} onValueChange={handleFilterChange}>
                        <SelectTrigger
                          className="w-[160px] rounded-lg sm:ml-auto"
                          aria-label="Select a value"
                        >
                        <SelectValue placeholder="mois" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="mois" className="rounded-lg">
                            mois
                          </SelectItem>
                          <SelectItem value="trimestre" className="rounded-lg">
                            trimestre
                          </SelectItem>
                          <SelectItem value="annee" className="rounded-lg">
                            annee
                          </SelectItem>
                        </SelectContent>
                    </Select> */}

                    {/* <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                          className="w-[160px] rounded-lg sm:ml-auto"
                          aria-label="Select a value"
                        >
                          <SelectValue placeholder="Last 3 months" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                          </SelectItem>
                          <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                          </SelectItem>
                          <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                          </SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>

                <Bar
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Période',
                                    font: { size: 16 },
                                },
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'CAD',
                                    font: { size: 16 },
                                },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default Lld;
