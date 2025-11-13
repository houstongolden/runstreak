import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Company } from "@/types";
import { formatCurrency, getRankEmoji } from "@/lib/formatters";
import { getCompanyLogoUrl, getFounderAvatarUrl } from "@/lib/avatars";
import { Building2 } from "lucide-react";

interface LeaderboardTableProps {
  companies: Company[];
  view?: "total" | "percent";
}

export const LeaderboardTable = ({ companies, view = "total" }: LeaderboardTableProps) => {
  // Sort companies based on view
  const sortedCompanies = [...companies].sort((a, b) => {
    if (view === "percent") {
      const percentA = a.arr_donated > 0 ? (a.total_donated / a.arr_donated) : 0;
      const percentB = b.arr_donated > 0 ? (b.total_donated / b.arr_donated) : 0;
      return percentB - percentA;
    }
    return b.total_donated - a.total_donated;
  });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-8 lg:w-12 text-xs md:text-sm text-muted-foreground px-2 lg:px-2">#</TableHead>
            <TableHead className="text-xs md:text-sm text-muted-foreground px-2 lg:px-3">Startup</TableHead>
            <TableHead className="text-xs md:text-sm text-muted-foreground px-2 lg:px-3 hidden sm:table-cell">Founder</TableHead>
            {view === "total" ? (
              <>
                <TableHead className="text-right text-xs md:text-sm text-muted-foreground px-2 lg:px-3">Total Donated</TableHead>
                <TableHead className="text-right text-xs md:text-sm text-muted-foreground px-2 lg:px-3 hidden lg:table-cell">Annual Donated</TableHead>
              </>
            ) : (
              <>
                <TableHead className="text-right text-xs md:text-sm text-muted-foreground px-2 lg:px-3">Total Donated</TableHead>
                <TableHead className="text-right text-xs md:text-sm text-muted-foreground px-2 lg:px-3 hidden lg:table-cell">Annual Donated</TableHead>
                <TableHead className="text-right text-xs md:text-sm text-muted-foreground px-2 lg:px-3">%</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompanies.map((company, index) => {
            const rank = index + 1;
            const displayRank = getRankEmoji(rank);
            
            return (
              <TableRow
                key={company.id}
                className="border-border hover:bg-muted/30 transition-all duration-200"
              >
                <TableCell className="font-medium px-2 lg:px-2">
                  <span className="text-sm md:text-base">{displayRank}</span>
                </TableCell>
                
                <TableCell className="px-2 lg:px-3">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="h-6 w-6 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={getCompanyLogoUrl(company.name)}
                        alt={`${company.name} logo`}
                        className="h-5 w-5 md:h-8 md:w-8 object-contain"
                        onError={(e) => {
                          // Fallback to icon if favicon fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<svg class="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-semibold truncate">{company.name}</div>
                      {company.description && (
                        <div className="text-[10px] md:text-xs text-muted-foreground truncate hidden md:block">
                          {company.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="px-2 lg:px-3 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    {company.founder_name && (
                      <img
                        src={getFounderAvatarUrl(company.founder_name)}
                        alt={company.founder_name}
                        className="h-6 w-6 md:h-7 md:w-7 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    {company.founder_handle && (
                      <a
                        href={`https://x.com/${company.founder_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs md:text-xs text-primary hover:underline truncate"
                      >
                        @{company.founder_handle}
                      </a>
                    )}
                  </div>
                </TableCell>
                
                {view === "total" ? (
                  <>
                    <TableCell className="text-right px-2 lg:px-3">
                      <span className="font-mono font-semibold text-[10px] md:text-xs">
                        {formatCurrency(company.total_donated)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right px-2 lg:px-3 hidden lg:table-cell">
                      <span className="font-mono font-semibold text-xs">
                        {company.arr_donated > 0 ? formatCurrency(company.arr_donated) : "—"}
                      </span>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-right px-2 lg:px-3">
                      <span className="font-mono font-semibold text-[10px] md:text-xs">
                        {formatCurrency(company.total_donated)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right px-2 lg:px-3 hidden lg:table-cell">
                      <span className="font-mono font-semibold text-xs">
                        {company.arr_donated > 0 ? formatCurrency(company.arr_donated) : "—"}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right px-2 lg:px-3">
                      <span className="font-mono font-semibold text-primary text-[10px] md:text-xs">
                        {company.arr_donated > 0
                          ? `${(company.total_donated / company.arr_donated).toFixed(1)}%`
                          : "—"}
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
