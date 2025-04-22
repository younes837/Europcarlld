"use client";
/* eslint-disable react/prop-types */

import Chart from "./Chart";
import { useEffect, useState } from "react";
import Loader from "./Loader";

function TopClient({ isLoadingFn }) {
  const [data, setData] = useState([]);
  const [totalClient, setTotalClient] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/cal_grille_offre_original`
        );
        const data = await res.json();
        setTotalClient(data.length);
        setData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClient();
  }, []);

  if (isLoading && isLoadingFn) {
    return <Loader />;
  }

  return (
    <div className="">
      <div className="bg-white rounded-lg shadow mb-4">
        {/* <div className="px-4 py-3 flex flex-row items-center justify-between border-b">
        
        <div className="relative">
          <button
            className="focus:outline-none"
            id="dropdownMenuLink"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <i className="fas fa-ellipsis-v text-gray-400 text-sm"></i>
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
            <div className="px-4 py-2 text-gray-700 font-semibold border-b">
              Dropdown Header:
            </div>
            <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="#">
              Action
            </a>
            <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="#">
              Another action
            </a>
            <div className="border-t my-1"></div>
            <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="#">
              Something else here
            </a>
          </div>
        </div>
      </div> */}

        <div className="p-6 ">
          <div className="w-full flex justify-center items-center">
            <h1 className="font-bold text-xl">Top 20 Clients par Parc</h1>
          </div>
          <div className="h-[330px] w-full ">
            <Chart data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopClient;
