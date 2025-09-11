import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DataListRow from "@/components/DataListRow";
import {
  DataSourceRecordType,
  DataSourceType,
  GoogleSheetsConfig,
} from "@/server/models/DataSource";
import { getOAuthCredentials, getOAuthURL, getSheets } from "@/services/google";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { NewDataSourceConfig } from "../schema";

export default function GoogleSheetsFields({
  dataSourceName,
  recordType,
  config,
  onChange,
}: {
  dataSourceName: string;
  recordType: DataSourceRecordType | null;
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.GoogleSheets) {
    return;
  }

  return (
    <GoogleSheetsFieldsWithOAuth
      dataSourceName={dataSourceName}
      recordType={recordType}
      config={config}
      onChange={onChange}
    />
  );
}

function GoogleSheetsFieldsWithOAuth({
  dataSourceName,
  recordType,
  config,
  onChange,
}: {
  dataSourceName: string;
  recordType: DataSourceRecordType | null;
  config: Partial<GoogleSheetsConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  // Use a ref to keep track of if OAuth has been completed
  // This updates immediately, so no chance of duplicate requests
  const hasCompletedOAuth = useRef<boolean>(false);
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [error, setError] = useState("");

  const code = searchParams.get("code");
  const scope = searchParams.get("scope");

  // Complete OAuth process when code and scope are set
  useEffect(() => {
    const completeOAuth = async () => {
      try {
        if (code && scope && !hasCompletedOAuth.current) {
          hasCompletedOAuth.current = true;
          setError("");
          setLoading(true);
          const oAuthCredentials = await getOAuthCredentials(
            window.location.href,
          );
          onChange({ oAuthCredentials });
        }
      } catch {
        setError("Could not authorize with Google.");
      } finally {
        setLoading(false);
      }
    };
    completeOAuth();
  }, [code, onChange, scope]);

  // Load sheet names if OAuth complete and Spreadsheet ID provided
  useEffect(() => {
    const loadSheets = async () => {
      try {
        if (config.oAuthCredentials && config.spreadsheetId) {
          setError("");
          setLoading(true);
          const sheets = await getSheets(
            config.oAuthCredentials,
            config.spreadsheetId,
          );
          setSheets(sheets);
        }
      } catch {
        setError("Could not load sheet names.");
      } finally {
        setLoading(false);
      }
    };
    loadSheets();
  }, [config.oAuthCredentials, config.spreadsheetId]);

  // Extract the Spreadsheet ID from the user-provided URL
  useEffect(() => {
    const spreadsheetId = extractSpreadsheetIdWithUrlParser(spreadsheetUrl);
    if (config.spreadsheetId !== spreadsheetId) {
      onChange({ spreadsheetId });
    }
  }, [config.spreadsheetId, onChange, spreadsheetUrl]);

  const onClickConnect = async () => {
    setLoading(true);
    try {
      const url = await getOAuthURL({
        dataSourceName,
        recordType: recordType || "",
        dataSourceType: DataSourceType.GoogleSheets,
      });
      window.location.href = url;
    } catch {
      setError("Could not authorize with Google.");
    }
  };

  if (!config.oAuthCredentials) {
    return (
      <div className="mt-4">
        <Button type="button" onClick={onClickConnect} disabled={loading}>
          Connect to Google Sheets
        </Button>
      </div>
    );
  }

  return (
    <>
      <DataListRow label="Spreadsheet URL">
        <Input
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/1GB...doA/edit?gid=0#gid=0"
          value={spreadsheetUrl || ""}
          onChange={(e) => setSpreadsheetUrl(e.target.value)}
        />
      </DataListRow>
      {config.spreadsheetId &&
        (sheets.length > 0 ? (
          <DataListRow label="Sheet Name">
            <Select
              value={config.sheetName || ""}
              onValueChange={(sheetName) => onChange({ sheetName })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataListRow>
        ) : (
          <p className="text-xs">Loading sheet names...</p>
        ))}

      {error && (
        <div>
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
    </>
  );
}

function extractSpreadsheetIdWithUrlParser(spreadsheetUrl: string): string {
  try {
    const url = new URL(spreadsheetUrl);

    if (!url.hostname.includes("docs.google.com")) {
      return "";
    }

    // Extract the ID from the pathname
    const pathMatch = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

    return pathMatch ? pathMatch[1] : "";
  } catch {}
  return "";
}
