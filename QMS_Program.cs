using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using QMS.Functions.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();
        services.AddSingleton<IDbConnectionFactory>(_ =>
            new SqlConnectionFactory(
                Environment.GetEnvironmentVariable("SqlConnectionString")
                ?? throw new InvalidOperationException("SqlConnectionString not configured.")));
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IOpportunityRepository, OpportunityRepository>();
        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<ISiteRepository, SiteRepository>();
    })
    .Build();

host.Run();
