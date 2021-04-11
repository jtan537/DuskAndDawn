using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MoveZLR : MonoBehaviour
{
    private bool move;
    public GameObject left;
    public GameObject right;
    private int speed = 7;

    // Start is called before the first frame update
    void Start()
    {
        move = true;
        
    }

    // Update is called once per frame
    void FixedUpdate()
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
