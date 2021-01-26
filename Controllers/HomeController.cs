using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PDFGenPOC.Models;
using System.Text.Encodings.Web;
using System.Web;
using Newtonsoft.Json;
using System.Data;
using System.Text;

namespace PDFGenPOC.Controllers
{
    [Route("[controller]/{action}")]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            ViewBag.EncodedData = HttpUtility.UrlEncode("http://localhost:62322/home/WordToPDFdownload");
            return View();
        }

        public IActionResult Worddownload()
        {
            Stream stream = new FileStream(@"C:\Users\balaji.mohan\Downloads\word-template-sample.docx", FileMode.Open);
            MemoryStream memoryStream = new MemoryStream();
            stream.CopyTo(memoryStream);
            stream.Close();
            return File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "output.docx");
        }

        [HttpPost]
        public JsonResult ConvertCsvFileToJsonObjectv2(IFormFile csvfile)
        {
            var csv = new List<string[]>();
            var lines = new List<string>();

            using (var reader = new StreamReader(csvfile.OpenReadStream()))
            {
                while (reader.Peek() >= 0)
                {
                    var line = reader.ReadLine();
                    lines.Add(line);
                    csv.Add(line.Split(','));
                }
            }

            var headers = lines[0].Split(',');

            var listObjResult = new List<Dictionary<string, string>>();

            for (int i = 1; i < lines.Count(); i++)
            {
                var objResult = new Dictionary<string, string>();
                for (int j = 0; j < headers.Length; j++)
                    objResult.Add(headers[j], csv[i][j]);

                listObjResult.Add(objResult);
            }
            var json = JsonConvert.SerializeObject(listObjResult);

            return Json(json);
        }
        [HttpGet]
        public JsonResult ConvertCsvFileToJsonObject()
        {
            var csv = new List<string[]>();
            var lines = new List<string>();
            Stream csvfile = new FileStream(@"C:\Users\balaji.mohan\Downloads\sampleCSV.csv", FileMode.Open);
            using (var reader = new StreamReader(csvfile))
            {
                while (reader.Peek() >= 0)
                {
                    var line = reader.ReadLine();
                    lines.Add(line);
                    csv.Add(line.Split(','));
                }
            }

            var headers = lines[0].Split(',');

            var listObjResult = new List<Dictionary<string, string>>();

            for (int i = 1; i < lines.Count(); i++)
            {
                var objResult = new Dictionary<string, string>();
                for (int j = 0; j < headers.Length; j++)
                    objResult.Add(headers[j], csv[i][j]);

                listObjResult.Add(objResult);
            }
            var json = JsonConvert.SerializeObject(listObjResult);

            return Json(json);
        }
        //public IActionResult ConvertXlsFileToJsonObject(IFormFile xlsfile)
        //{
        //    using (ExcelEngine excelEngine = new ExcelEngine())
        //    {
        //        IApplication application = excelEngine.Excel;
        //        var fileName = "output.xlsx";
        //        var filePath = Path.Combine(Directory.GetCurrentDirectory(), @"wwwroot\files", fileName);
        //        var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
        //        Stream stream = xlsfile.OpenReadStream();
        //        stream.CopyToAsync(fileStream);
        //        //The workbook is opened.

        //        IWorkbook workbook = application.Workbooks.Open(fileStream, ExcelOpenType.Automatic);
        //        IWorksheet worksheet = workbook.Worksheets[0];

        //        //Export worksheet data into CLR Objects
        //        IList<Customer> customers = worksheet.ExportData<Customer>(1, 1, worksheet.UsedRange.LastRow, workbook.Worksheets[0].UsedRange.LastColumn);

        //        //open file stream
        //        using (StreamWriter file = File.CreateText("../../Output/data.json"))
        //        {
        //            JsonSerializer serializer = new JsonSerializer();

        //            //serialize object directly into file stream
        //            serializer.Serialize(file, customers);
        //        }
        //    }
        //}
        //public IActionResult ConvertXlsFileToJsonObject(IFormFile xlsfile)
        //{
        //    //var memoryStream = new MemoryStream();
        //    //xlsfile.OpenReadStream().CopyTo(memoryStream);
        //    var estEncoding = Encoding.GetEncoding(1252);
        //    var xls = Encoding.UTF8.GetBytes(System.IO.File.ReadAllText(@"C:\Users\balaji.mohan\Downloads\ir211wk12sample.xlsx"));

        //    var excelContent = ParseExcel(new MemoryStream(xls));
        //    string json = JsonConvert.SerializeObject(excelContent);
        //    Console.Write(json);
        //    return View();
        //}
        //public static IEnumerable<Dictionary<string, object>> ParseExcel(Stream document)
        //{
        //    using (var reader = ExcelReaderFactory.CreateReader(document))
        //    {
        //        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
        //        {
        //            UseColumnDataType = true,
        //            ConfigureDataTable = (tableReader) => new ExcelDataTableConfiguration()
        //            {
        //                UseHeaderRow = true,
        //            }
        //        });
        //        return MapDatasetData(result.Tables.Cast<DataTable>().First());
        //    }
        //}
        //public static IEnumerable<Dictionary<string, object>> MapDatasetData(DataTable dt)
        //{
        //    foreach (DataRow dr in dt.Rows)
        //    {
        //        var row = new Dictionary<string, object>();
        //        foreach (DataColumn col in dt.Columns)
        //        {
        //            row.Add(col.ColumnName, dr[col]);
        //        }
        //        yield return row;
        //    }
        //}
        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
