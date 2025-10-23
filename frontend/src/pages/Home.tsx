import { useQuery } from "@tanstack/react-query";
import * as apiClient from "../api-client";
import LatestDestinationCard from "../components/LastestDestinationCard";

const Home = () => {
  const { data: hotels, isError, isLoading } = useQuery({
    queryKey: ["fetchHotels"],
    queryFn: apiClient.fetchHotels,
    retry: 1,
  });

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading hotels. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  const topRowHotels = hotels?.slice(0, 2) || [];
  const bottomRowHotels = hotels?.slice(2) || [];

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-bold">Latest Destinations</h2>
      <p>Most recent desinations added by our hosts</p>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {topRowHotels.map((hotel) => (
            <LatestDestinationCard key={hotel._id} hotel={hotel} />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {bottomRowHotels.map((hotel) => (
            <LatestDestinationCard key={hotel._id} hotel={hotel} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
