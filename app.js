const http = require("http");
const url = require("url");
const formidable = require("formidable");
const fs = require("fs");

var handlers = {};
let products = [];
//home page
handlers.home = (req, res) => {
  let html = ``;
  fs.readFile("database/data.json", "utf8", (err, data) => {
    let datas = JSON.parse(data);
    datas.forEach((product) => {
      html += `<tr>
              <td> <img src="../${product.image}" alt="" width="100px" ></td>
              <td>${product.name}</td>
              <td>${product.price}</td>
              <td>${product.description}</td>
              </tr> `;
    });
  });
  // console.log("html", html);
  fs.readFile("views/index.html", "utf8", function (err, data) {
    res.writeHead(200, { "Content-Type": "text/html" });
    data = data.replace("{list-product}", html);
    res.write(data);
    return res.end();
  });
};
// products page
handlers.products = (req, res) => {
  if (req.method === "GET") {
    fs.readFile("views/products.html", function (err, data) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      return res.end();
    });
  } else {
    const form = new formidable.IncomingForm();
    form.uploadDir = "uploads/";
    form.parse(req, (err, fields, files) => {
      let { name, price, description, image } = fields;
      if (err) {
        // Kiểm tra nếu có lỗi
        console.error(err.message);
        return res.end(err.message);
      }

      //Lấy ra đường dẫn tạm của tệp tin trên server
      let tmpPath = files.image.filepath;
      let newPath = form.uploadDir + files.image.originalFilename;
      image = newPath;
      // console.log(newPath);

      // Đổi tên của file tạm thành tên mới và lưu lại
      fs.rename(tmpPath, newPath, (err) => {
        if (err) throw err;
        let fileType = files.image.mimetype;
        let mimeTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (mimeTypes.indexOf(fileType) === -1) {
          res.writeHead(200, { "Content-Type": "text/html" });
          return res.end(
            "The file is not in the correct format: png, jpeg, jpg"
          );
        }
      });
      let product = {
        name: name,
        price: price,
        description: description,
        image: image,
      };
      fs.readFile("database/data.json", "utf8", function (err, data) {
        let products = JSON.parse(data);
        console.log(products);
        products.push(product);
        fs.writeFile("database/data.json", JSON.stringify(products), (err) => {
          console.log(err);
        });
      });

      res.writeHead(301, { Location: "/" });
      res.end();
    });
  }
};
// handlers.users page

handlers.users = (req, res) => {
  getFile(req, res, "views/users.html");
  fs.readFile("views/users.html", function (err, data) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(data);
    return res.end();
  });
};

// not found
handlers.notFound = (req, res) => {
  fs.readFile("views/notFound.html", function (err, data) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(data);
    return res.end();
  });
};

const router = {
  "": handlers.home,
  users: handlers.users,
  products: handlers.products,
};
let mimeTypes = {
  jpg: "images/jpg",
  png: "images/png",
  js: "text/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2",
  eot: "application/vnd.ms-fontobject",
};
let server = http.createServer((req, res) => {
  //get url and parse

  var parseUrl = url.parse(req.url, true);
  //
  // //get the path

  var path = parseUrl.pathname;
  var trimPath = path.replace(/^\/+|\/+$/g, "");

  let urlPath = req.url;
  const filesDefences = urlPath.match(
    /\.js|\.css|\.png|\.svg|\.jpg|\.ttf|\.woff|\.woff2|\.eot/
  );
  if (filesDefences) {
    const extension = mimeTypes[filesDefences[0].toString().split(".")[1]];
    res.writeHead(200, { "Content-Type": extension });
    fs.createReadStream(__dirname + req.url).pipe(res);
  } else {
    var chosenHandler =
      typeof router[trimPath] !== "undefined"
        ? router[trimPath]
        : handlers.notFound;
    chosenHandler(req, res);
  }
});

server.listen(3000, function () {
  console.log("server running at http://localhost:3000");
});
