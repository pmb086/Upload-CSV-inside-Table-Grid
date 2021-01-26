using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace PDFGenPOC.Controllers
{
    [Route("[controller]/{action}")]
    public class DemoController : Controller
    {
        public IActionResult Index()
        {
            //Stream stream = new FileStream(@"C:\Users\balaji.mohan\Downloads\word-template-sample.docx", FileMode.Open);
            //MemoryStream memoryStream = new MemoryStream();
            //stream.CopyTo(memoryStream);
            //var fileName = "output.docx";
            //var filePath = Path.Combine(Directory.GetCurrentDirectory(), @"wwwroot\files", fileName);
            //using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            //{
            //    fileStream.Write(memoryStream.ToArray());
            //}
            //stream.Close();
            return View();
        }
        [HttpGet("{filename}")]
        public IActionResult Worddownload(string filename)
        {
            Stream stream = new FileStream(@"C:\Users\balaji.mohan\Downloads\word-template-sample.docx", FileMode.Open);
            MemoryStream memoryStream = new MemoryStream();
            stream.CopyTo(memoryStream);
            stream.Close();
            return File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename);
        }

    }
}