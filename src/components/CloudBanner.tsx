import { useEffect, useState } from "react";
import { getCloudStatus, subscribeCloud, type CloudStatus } from "../lib/cloudSync";

export function CloudBanner() {
  const [cloud, setCloud] = useState<CloudStatus>(getCloudStatus);

  useEffect(() => subscribeCloud(setCloud), []);

  if (!cloud.error) return null;

  return (
    <div className="mx-auto mb-3 max-w-6xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
      Nema veze sa onlajn bazom. Izmene ostaju na ovom uređaju i same se sačuvaju čim bude internet.
    </div>
  );
}
