using System.Data.Common;

namespace BookingSystem.Backend.Database;

public static class DataRecordExtensions
{
    public static int GetInt32(this DbDataReader reader, string name) => reader.GetInt32(reader.GetOrdinal(name));

    public static decimal GetDecimal(this DbDataReader reader, string name) => reader.GetDecimal(reader.GetOrdinal(name));

    public static bool GetBoolean(this DbDataReader reader, string name) => reader.GetBoolean(reader.GetOrdinal(name));

    public static string GetString(this DbDataReader reader, string name) => reader.GetString(reader.GetOrdinal(name));

    public static string? GetNullableString(this DbDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    public static DateTime GetDateTime(this DbDataReader reader, string name) => reader.GetDateTime(reader.GetOrdinal(name));

    public static DateTime? GetNullableDateTime(this DbDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    public static int? GetNullableInt32(this DbDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetInt32(ordinal);
    }

    public static long GetInt64(this DbDataReader reader, string name) => reader.GetInt64(reader.GetOrdinal(name));

    public static long? GetNullableInt64(this DbDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetInt64(ordinal);
    }

    public static TimeSpan GetTimeSpan(this DbDataReader reader, string name) => reader.GetFieldValue<TimeSpan>(reader.GetOrdinal(name));
}
