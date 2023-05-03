const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const getDate = require("./date");
// const date = require(__dirname + "/date.js")
const mongoose = require('mongoose'); 
const _ = require("lodash"); 


const app = express();
const items = [];
const workItems = [];
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB' , {useNewUrlParser: true});

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const itemsSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true, "Name is required, name has not been specified."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Click the + button to add a new item."
});

const item3 = new Item({
  name: " <-- Click on the checkbox to delete an item."
})



const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List" , listSchema);


app.get("/" , function(req, res){


  Item.find({}).then(function (foundItem) {

  if (foundItem.length === 0) {
    Item.insertMany(defaultItems).then(function () {
      console.log("Successfully inserted defaultItems to DB.");
    }).catch(function(error) {
      console.log("Posts already exist.");
    });
    res.redirect("/");
  } else {

    res.render('list', {listTitle: "Today", newListItems: foundItem});
  }
  // const day = date.getDate();

  });    
});

const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems).then(function () {
//   console.log("Successfully inserted defaultItems to DB.");
// }).catch(function(error) {
//   console.log(error);
// });



app.post('/', function(req, res) {
   const itemName = req.body.newItem;
   const listName = req.body.list;
   
   const item = new Item({
    name: itemName
   });

   if (listName === "Today") {
    item.save();
    res.redirect("/");
   } else {
    List.findOne({name: listName}).then(function(foundList) {
      foundList.items.push(item)
      foundList.save();
      res.redirect("/" + listName);
    }). catch(function(error) {
      console.log(error);
    });
   }

  //  item.save();

  //  res.redirect("/" + listName);



});


app.post("/delete", function(req, res) {
  const  checkItemId = req.body.checkbox;
  const listName = req.body.listName;


  if (listName === "Today") {
    Item.findByIdAndRemove(checkItemId).then(function() {
      console.log("Successfully deleted task");
    }).catch(function(error) {
      console.log(error);
    });
    res.redirect("/");
  } else {

      List.findOneAndUpdate( {name: listName}, {$pull: {items: {_id: checkItemId}}}).then(function(foundList) {
        
          res.redirect("/" + listName)
      }).catch(function(error) {
        console.log(error);
      });


  }

  
});


app.get("/:customListName" , function(req, res)  {
  const customListName = _.capitalize(req.params.customListName);
 
  
  List.findOne({name: customListName}).then(function (foundList){
    
  if(!foundList){
    const list = new List({
      name: customListName,
      items: defaultItems
    });
  
    list.save();
    res.redirect("/" + customListName);
  }else   {
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
  } 

  }).catch(function(error) {
    console.log("List doesn't exist.")
  });
  
  

});





app.listen(3000, function() {
    console.log("Server started on port 3000.")
});