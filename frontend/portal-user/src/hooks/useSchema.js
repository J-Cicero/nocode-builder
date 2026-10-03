import { useEffect, useState, useCallback } from "react";
import schemaApi from "../api/schemaApi";

export function useSchema(projectId) {
  const [tables, setTables] = useState([]);
  const [fieldsByTable, setFieldsByTable] = useState({});
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTables = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await schemaApi.getSchema(projectId);
      const tableList = data?.tables || [];
      setTables(tableList);
      setRelations(data?.relations || []);
      const fieldsMap = {};
      for (const t of tableList) {
        fieldsMap[t.tracking_id] = t.fields || [];
      }
      setFieldsByTable(fieldsMap);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    fieldsByTable,
    relations,
    loading,
    error,
    refresh: fetchTables,
  };
}

export default useSchema;
