using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MoveZLR : MonoBehaviour
{
    private bool move;
    private GameObject left;
    private GameObject right;
    private int speed = 10;

    // Start is called before the first frame update
    void Start()
    {
        move = true;
        left = gameObject.transform.parent.gameObject.transform.GetChild(1).gameObject;
        right = gameObject.transform.parent.gameObject.transform.GetChild(2).gameObject;
    }

    // Update is called once per frame
    void Update()
    {
        if (move == true){
            transform.Translate(Vector3.forward * speed * Time.deltaTime);
        }
        else if (move == false){
            transform.Translate(Vector3.back * speed * Time.deltaTime);
        }
        // print(Vector3.Distance(gameObject.transform.position, top.transform.position));
        if (Vector3.Distance(gameObject.transform.position, left.transform.position) < 5){
            move = true;
        }
        else if (Vector3.Distance(gameObject.transform.position, right.transform.position) < 5){
            move = false;
        }
    }
}
