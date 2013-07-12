# API Document

POST
----

1.	`GET` Show all the posts
		
		/posts/

	Example response:

		[
		  {
		    "title": "Article 2The trustee must not take advantage.",
		    "author": {
		      "email": "kenda",
		      "photoUrl": "http://ku4n.com/images/profilePictures/normal_905386.png",
		      "_id": "51db755ca2c8ec7f7e000248",
		      "__v": 0,
		      "settings": {
		        "privacy": false
		      },
		      "subscribes": [
		        null
		      ],
		      "name": "kenda zwickl"
		    },
		    "body": "He used to be a mail carrier .This contract is null and void.",
		    "_id": "51dc11cb06ed25e51300270a",
		    "__v": 0,
		    "meta": {
		      "votes": 172
		    },
		    "pics": [
		      "http://ku4n.com/images/uploads/21.jpg"
		    ],
		    "downVoters": [],
		    "upVoters": [
		      "51db755ca2c8ec7f7e0001f7",
		      "51db755ca2c8ec7f7e0001f8",
		      "51db755ca2c8ec7f7e0001f9",
		      ...
		    ],
		    "date": "2013-07-29T15:00:00.000Z",
		    "comments": [],
		    "score": 187.52192009563387
		  },
		  ...
		]

2.	`GET` Show all the posts

		/posts/user/:id/:page

	-	`id` - User ID 
	-	`page` - The number of page of results

	Example response:

		{
		  "next": true,
		  "docs": [
		    {
		      "title": "I dare not touch the flower for its tenderness .",
		      "author": "51db755ca2c8ec7f7e000248",
		      "body": "The star is reportedly very ill .Mary will not...",
		      "channel": {
		        "name": "kuwait",
		        "_id": "51db756b11bbae947e000072"
		      },
		      "_id": "51dc12c006ed25e5130083b5",
		      "__v": 0,
		      "meta": {
		        "votes": -3
		      },
		      "pics": [
		        "http://ku4n.com/images/uploads/30.jpg"
		      ],
		      "downVoters": [
		        "51db755ca2c8ec7f7e00016c",
		        "51db755ca2c8ec7f7e00016d",
		        ...
		      ],
		      "upVoters": [
		        "51db755ca2c8ec7f7e00012c",
		        "51db755ca2c8ec7f7e00012e",
		        ...
		      ],
		      "date": "2013-07-26T15:00:00.000Z"
		    },
		    ...
		  ]
		}