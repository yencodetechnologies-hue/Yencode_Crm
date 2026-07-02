import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CallingQueue() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/lead-table?mode=call", { replace: true });
  }, [navigate]);

  return null;
}

