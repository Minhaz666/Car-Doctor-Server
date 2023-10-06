const express = require('express')
const app = express()
var cors = require('cors')
const jwt=require('jsonwebtoken');
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// middleWare
app.use(cors());
app.use(express.json());

// mongo connection
const username = process.env.DB_USER
const pass = process.env.DB_PASS
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

const uri = `mongodb+srv://${username}:${pass}@clusterfirst.7ajn2mv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

 const verify=(req,res,next)=>{
    console.log('hitting verify')
    const authorization=req.headers.authorization
    if(!authorization){
        return res.status(401).send({error:true,message:'unauthorized'})
    }
    const token=authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
        if(error){
            return res.status(401).send({error:true , message:'unauthorized'})
        }
        req.decoded=decoded;
        next();
    })
 }

async function run() {
    try {
       
// JWT
        app.post('/jwt',(req,res)=>{
            const user=req.body;
            console.log(user);
            const token= jwt.sign(
                user
              , ACCESS_TOKEN_SECRET , { expiresIn: '1h' });
                console.log(token)
                // value pathanor jonne json sting banano lagbey
              res.send({token})
        })

//databaseCreationOrConnection
        const database = client.db("carDoctor");
        const carDoctorCollection = database.collection("users");
        const carDoctorBookingCollection = database.collection("bookings");

//FOR GETTING ALL INFORMATION IN DATABASE
        app.get('/services', async (req, res) => {
            const services = carDoctorCollection.find();
            const result = await services.toArray()
            res.send(result)
        })

        app.get('/services/:id',async(req,res)=>{
            const id = req.params.id;
            //find er moddhe 2ta perameter hishebe pathano possible jeta hocche query and option
            // naming er somoy database kheyal rakha lagbey
            const query = { _id: (id) };
            // option e ja ja lagbey shetar nam er sathe 1 r na lagley 0
            const options = {
                //suppose i need only title price and service id
                projection:{
                    title: 1, price: 1,service_id:1,img:1
                }
            }       
            const result = await carDoctorCollection.findOne(query,options);
            res.send(result)
        })

//for getting specific data another system though i have problem
        // app.get('bookings',async(req,res)=>
        // {
        //     console.log(req.query);
        //     let query={}
        //     if(req.query?.email)
        //     {
        //         query={email:req.query.email}
        //     }
        //     const result = await carDoctorBookingCollection.find(query).toArray();
        //     res.send(result)
        // })

//FOR GET ALL IN DATABASE FOR BOOKING PERPOUSES
        app.get('/bookings',async(req,res)=>{
            const services = carDoctorBookingCollection.find();
            const result = await services.toArray()
            res.send(result)
        })

//FOR GET SINGLE CUSTOMER REQUIRES
        app.get('/bookings/:email', verify ,async(req,res)=>{
            const email= req.params.email;
            const decoded=req.decoded
            console.log("verify hoise",decoded,email)
            if(decoded.email !== email){
                return res.status(403).send({ error: 1, message: 'forbidden access' })
            }
            const query={email:(email)}
            const singleservice = await carDoctorBookingCollection.find(query).toArray()
            res.send(singleservice)
           
        })

//FOR BOOKING CUSTOMER
        app.post('/bookings',async(req,res)=>{
            const booking=req.body;
            console.log(booking)
            const result = await carDoctorBookingCollection.insertOne(booking);
            res.send(result);
        })

//FOR DELETE
        app.delete('/bookings/:id',async(req,res)=>{
            const id=req.params.id;
            console.log(id)
            const query={_id:(id)}
            const result=await carDoctorBookingCollection.deleteOne(query);
            res.send(result);
        })

//FOR UPDATE CONFIRM
        app.patch('/bookings/:id',async(req,res)=>{
            const id = req.params.id;
            // console.log (id);
            const filter={_id:(id)};
            const updateBooking=req.body;
            const updateDoc = {
                $set: {
                  status: updateBooking.status
                },
              };
            // console.log(updateBooking)
            const result = await carDoctorBookingCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

