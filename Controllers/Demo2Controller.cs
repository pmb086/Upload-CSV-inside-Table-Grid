using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace PDFGenPOC.Controllers
{
    [Route("[controller]/{action}")]
    public class Demo2Controller : Controller
    {
        public IActionResult Index()
        {
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